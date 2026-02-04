import argparse
import asyncio

from websockets.server import serve

from consts import RESOLUTION_MAP
from ws_server import SingleClientWsServer, WsReceiver

parser = argparse.ArgumentParser(description="PS Web Remote Play")
parser.add_argument("server_address", help="Address of server (ip:port)")
parser.add_argument("ps_address", help="Address of PS console")
args = parser.parse_args()

class Server:
	_CONFIG_COOKIE_NAME = "config"

	@staticmethod
	def parse_config_on_connection(websocket):
		cookies = websocket.request_headers.get('Cookie', {})
		cookies_parts = cookies.split("=")
		config = None
		for i, cookie in enumerate(cookies_parts):
			if cookie == Server._CONFIG_COOKIE_NAME:
				config = cookies_parts[i + 1].strip()
				break
		if config is None:
			raise Exception("Configuration not found in connection cookies")
		return config.split(":")

event_loop = asyncio.new_event_loop()

GAME = PsGame(PS_LOCAL_IP)
AV_RECEIVER = None
	
async def on_connect(websocket):
	global GAME, AV_RECEIVER
	token, resolution, fps, quality = parse_config_on_connection(websocket)
	validate_configs(token, resolution, fps, quality)

	resolution = RESOLUTION_MAP.get(resolution)
	link_to_existed = await GAME.link_to_existed_session(resolution, fps, quality)
	
	if not link_to_existed:
		receiver = WsReceiver(asyncio.get_running_loop(), websocket)
		await GAME.create_session(receiver, resolution, fps, quality)
		AV_RECEIVER = receiver
	else:
		AV_RECEIVER.set_websocket(websocket)
		GAME.request_video_keyframe()

async def on_message(message):
	command = convert_byte_to_int(message[0], signed = False)
	await process_controller_command(command, message)

async def process_controller_command(type_command, message):
	global GAME
	if type_command == 1:
		command_button = convert_byte_to_int(message[1])
		action = "press" if command_button > 0 else "release"
		command_button *= (1) if command_button > 0 else (-1)
		await GAME.button(PS_COMMAND_BUTTON_MAP[command_button], action)
	elif type_command in (2, 3):
		x = convert_byte_to_signed_int(message[1])
		y = convert_byte_to_signed_int(message[2])
		GAME.left_stick(x, y) if type_command == 2 else GAME.right_stick(x, y)
	elif type_command == 4:
		GAME.request_video_keyframe()

def convert_byte_to_int(b, signed = True):
	return int.from_bytes([b], "big", signed = signed)

def main():
	ws_server = SingleClientWsServer(SERVER_HOST, SERVER_PORT)
	ws_server.set_connect_callback(on_connect)
	ws_server.set_disconnect_callback(on_disconnect)
	ws_server.set_message_callback(on_message)

	EVENT_LOOP.run_until_complete(ws_server.start())
	EVENT_LOOP.run_forever()

main()