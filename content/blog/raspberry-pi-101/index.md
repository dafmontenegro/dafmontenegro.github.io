---
title: "Raspberry Pi 101"
description: "Welcome to the exciting world of Raspberry Pi! Whether you're a tech enthusiast, a hobbyist, or someone just starting to explore the realms of computing and electronics, the Raspberry Pi is a versatile and affordable tool that opens up endless possibilities."
summary: "Welcome to the exciting world of Raspberry Pi! Whether you're a tech enthusiast, a hobbyist, or someone just starting to explore the realms of computing and electronics, the Raspberry Pi is a versatile and affordable tool that opens up endless possibilities."
date: 2025-02-12
lastmod: 2025-02-12
featureAlt: "Raspberry Pi logo"
coverAlt: "Raspberry Pi logo"
coverCaption: "Raspberry Pi logo"
thumbnailAlt: "Raspberry Pi logo"
categories: ["software", "hardware"]
tags: ["raspberry-pi"]
---
## Headless SSH Connection: Accessing Your Raspberry Pi Remotely

```bash
ssh user@hostname.local
```

## Transferring Files and Syncing Directories

```bash
rsync -avz --delete ./ user@hostname.local:/home/user/folder/
```

## GPIO

```python
import RPi.GPIO as GPIO

n_pin = ?

GPIO.setmode(GPIO.BOARD)
 
GPIO.setup(n_pin, GPIO.OUT)

GPIO.setup(n_pin, GPIO.IN, pull_up_down=GPIO.PUD_UP)
 
try:
    GPIO.output(n_pin, 0/1)
    input_state = GPIO.input(n_pin)
finally:
    GPIO.cleanup()
```
