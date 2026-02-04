import asyncio
import traceback

import websockets
from websockets.server import serve


class SingletonClientWsServer():
	def __init__(self, host, port):
		self._host = host
		self._port = port
		self._on_connect = None
		self._on_disconnect = None
		self._on_message = None
		self._client_websocket = None
		self._client_ip = None

	def set_connect_callback(self, on_connect):
		self._on_connect = on_connect

	def set_disconnect_callback(self, on_disconnect):
		self._on_disconnect = on_disconnect

	def set_message_callback(self, on_message):
		self._on_message = on_message

	async def _handle_new_connection(self, websocket, path):
		if self._client_websocket != None:
			print(f"skip connection {websocket.remote_address[0]}")
			return
		self._client_websocket = websocket
		self._client_ip = str(websocket.remote_address[0])
		self.log("new client connected")

		connected = await self._on_connect_safety(path)
		if connected:
			await self._on_message_safety()
		try:
			await self._client_websocket.close()
		except Exception:
			pass
		await self._on_disconnect_safety(websocket)
		self.log("client disconnected")
		self._client_ip = None
		self._client_websocket = None

	async def _on_disconnect_safety(self, websocket):
		try:
			await self._on_disconnect(websocket)
		except Exception as e:
			self.log("getting error execute disconnect handler")
			self.log(traceback.format_exc())		

	async def _on_message_safety(self):
		try:
			self.log("listen messages")
			async for message in self._client_websocket:
				await self._on_message(message)
		except Exception as e:
			self.log("getting error during listenning messages")
			self.log(traceback.format_exc())

	async def _on_connect_safety(self, path):
		try:
			await self._on_connect(self._client_websocket, path)
			return True
		except Exception as e:
			self.log("getting error execute connection handler")
			print(traceback.format_exc())
			return False

	def log(self, message):
		print(message + " " + self._client_ip)

	async def start(self):
		async def connect(websocket, path):
			await self._handle_new_connection(websocket, path)
		
		async def main():
			async with serve(connect, self._host, self._port):
				await asyncio.get_running_loop().create_future()
		try:
			print("websocket server is started")
			await main()
		except KeyboardInterrupt:
			exit(1)
