# PS Web Remote Play

PS Web Remote Play - Its web application based on [pyremoteplay](https://github.com/ktnrg45/pyremoteplay). Project includes server side (websocket server) and frontend side 

## How to start

* Clone this repository
* Create Python virtual enviroment

```
python3 -m venv webps
```

* Activate created enviroment

```
source webps/bin/activate
```

* Install dependencies

```
pip install -r requirements.txt
```

* Login to your PS account

```
python3 login.py
```

* Register PS console and activate remote playing on profile

```
python3 register_device.py
```

* Start Websocket server

```
python3 main.py --server_ip [SERVER] --server_port [PORT] --ps_ip 192.168.1.5
```

* Update `serverAddress` variable in path `frontent/js/main.js` to address of your server

* Run frontend server

```
cd front
python3 -m http.server [FRONT_PORT]
```

* Go to http://SERVER:FRONT_PORT and enjoy)))

Tutorial on [YouTube](https://youtube.com/123)
