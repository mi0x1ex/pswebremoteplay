import argparse
from game import Game
from consts import CLIENT_COMMAND_BUTTON_MAP
from enum import Enum
import asyncio
from ws_server import SingletonClientWsServer
from ws_receiver import WsReceiver

class ClientCommand(Enum):
	button = 1
	left_stick = 2
	right_stick = 3
	request_video_keyframe = 4


class Controller:
	_PS_IP_ARG = 'ps_ip'
	_SERVER_IP_ARG = 'server_ip'
	_SERVER_PORT_ARG = 'server_port'

	async def start(self):
		args = Controller.parse_args()
		self._game = Game(args.ps_ip)
		await self._start_ws_server(args)

	async def _start_ws_server(self, args):
		ws_server = SingletonClientWsServer(args.server_ip, args.server_port)
		async def on_connect(ws, path):
			await self._on_connect(ws, path) 
		async def on_message(ws):
			await self._on_message(ws)
		async def on_disconnect(ws):
			pass
		ws_server.set_connect_callback(on_connect)
		ws_server.set_message_callback(on_message)
		await ws_server.start()

	async def _on_connect(self, websocket, path):
		resolution, fps, quality = Controller.parse_config_on_connection(path)
		link_to_existed = await self._game.link_to_existed_session(resolution, fps, quality)
	
		if not link_to_existed:
			receiver = WsReceiver(asyncio.get_running_loop(), websocket)
			await self._game.create_session(receiver, resolution, fps, quality)
		else:
			self._game._av_receiver.set_websocket(websocket)

	async def _on_message(self, message):
		command = Controller.convert_byte_to_int(message[0], signed = False)
		await self._process_controller_command(command, message)

	async def _process_controller_command(self, type_command, message):
		if type_command == ClientCommand.button.value:
			command_button = Controller.convert_byte_to_int(message[1])
			action = "press" if command_button > 0 else "release"
			command_button *= (1) if command_button > 0 else (-1)
			await self._game.button(CLIENT_COMMAND_BUTTON_MAP[command_button], action)
		elif type_command == ClientCommand.left_stick.value:
			x = Controller.convert_byte_to_int(message[1])
			y = Controller.convert_byte_to_int(message[2])
			self._game.left_stick(x, y)
		elif type_command == ClientCommand.right_stick.value:
			x = Controller.convert_byte_to_int(message[1])
			y = Controller.convert_byte_to_int(message[2])
			self._game.right_stick(x, y)
		elif type_command == ClientCommand.request_video_keyframe.value:
			self._game.request_video_keyframe()

	@staticmethod
	def parse_args():
		parser = argparse.ArgumentParser(description="PS Web Remote Play")
		parser.add_argument("--" + Controller._SERVER_IP_ARG, help="IP of server")
		parser.add_argument("--" + Controller._SERVER_PORT_ARG, help="Port of server")
		parser.add_argument("--" + Controller._PS_IP_ARG, help="IP of PS console")
		return parser.parse_args()

	@staticmethod
	def parse_config_on_connection(path):
		configs = path.split("=")
		configs = configs[1].split(":")
		return configs[0], int(configs[1]), configs[2]

	@staticmethod
	def convert_byte_to_int(b, signed = True):
		return int.from_bytes([b], "big", signed = signed)

if __name__ == "__main__":
	controller = Controller()
	asyncio.new_event_loop().run_until_complete(controller.start())
