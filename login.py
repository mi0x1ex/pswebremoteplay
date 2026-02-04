from pyremoteplay import RPDevice
from pyremoteplay import oauth, profile

# This is the url that users will need to sign in
# Must be done in a web browser
url = oauth.get_login_url()
print("Follow link and login")
print(url)

redirect_url = input("Put url from web browser after login")

account = oauth.get_user_account(redirect_url)

user_profile = profile.format_user_account(account)
profiles = RPDevice.get_profiles()
profiles.update_user(user_profile)
profiles.save()
print("Profile was saved")
