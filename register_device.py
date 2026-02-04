from pyremoteplay import RPDevice

ip_address = input("Put IP of PS console:\n")

device = RPDevice(ip_address)
status = device.get_status()

if status is None:
	print("Unknown status of device")
	exit(1)
else:
	print(status)

player_name = input("Input player name:\n")
code = input("Activate remote playing and input secret code of device:\n")

device.register(player_name, code, save=True)
print("Device was registered. Remote playing is active")