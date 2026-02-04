from consts import RESOLUTION_MAP, AVAILABLE_FPS, QUALITY
from pyremoteplay.const import Quality
from pyremoteplay.device import RPDevice


class Game:
	def __init__(self, ip_address):
		self._ip_address = ip_address
		self._device = RPDevice(ip_address)
		self._last_action_counter = 0
		self._av_receiver = None

	async def create_session(self, av_receiver, resolution, fps, quality):
		self.validate_configs(resolution, fps, quality)
		self._av_receiver = av_receiver
		resolution = RESOLUTION_MAP.get(resolution)
		print(f"creating session: {self._ip_address}, resolution = {resolution}, fps = {fps}, quality = {quality}")
		self._device.disconnect()
		status = await self._device.async_get_status()
		if not status:
			raise Exception(f"Unknown status of PS. IP: {self._ip_address}")
		users = self._device.get_users()
		if not users:
			raise Exception(f"Users of PS not found. IP: {self._ip_address}")
		user = users[0]
		print(f"create session by user - {user}")
		if not self._device.is_on:
			self._device.wakeup(user)
			if not await self._device.async_wait_for_wakeup():
				raise Exception(f"Timed out waiting for PS to wakeup. IP: {self._ip_address}")
		self._device.create_session(user, resolution=resolution, fps=fps, receiver=av_receiver, quality=quality)
		if not await self._device.connect():
			raise Exception(f"Failed to start session. IP: {self._ip_address}, User: {user}")
		self._device.controller.start()

	async def link_to_existed_session(self, resolution, fps, quality):
		self.validate_configs(resolution, fps, quality)
		resolution = RESOLUTION_MAP.get(resolution)
		if not await self._device.async_wait_for_session():
			print(f"Existed session not found. IP: {self._ip_address}")
			return False
		session = self._device.session
		if resolution != session.resolution.value or fps != session.fps.value or Quality.parse(quality) != session.quality:
			print(f"Existed session has another configuration. Session will be create. IP: {self._ip_address}")
			self._device.disconnect()
			return False
		if not await self._av_receiver.is_alive():
			print(f"Existed session is broken. IP: {self._ip_address}")
			return False
		else:
			self.request_video_keyframe()
			return True

	def request_video_keyframe(self):
		last_frame = self._device._session._stream._av_handler._v_stream._last_complete
		self._device._session._stream.send_corrupt(1, last_frame)

	async def button(self, button, action):
		await self._device.controller.async_button(button, action=action)

	def left_stick(self, x, y):
		self._stick("left", x, y)

	def right_stick(self, x, y):
		self._stick("right", x, y)

	def stop(self):
		self._device.disconnect()

	def is_running(self):
		return self._device.connected

	def validate_configs(self, resolution, fps, quality):
		if resolution not in RESOLUTION_MAP.keys():
			raise Exception(f"Invalid resolution {resolution}")
		if fps not in AVAILABLE_FPS:
			raise Exception(f"Invalid FPS {fps}")	
		if quality not in QUALITY:
			raise Exception(f"Invalid quality {quality}")

	def _stick(self, t, x, y):
		self._device.controller.stick(t, axis="x", value=x/100)
		self._device.controller.stick(t, axis="y", value=y/100)
