---
title: "Pi-Tensorflow-Lite-Object-Detection"
description: "This project builds a real-time object detection system using a Raspberry Pi and a camera. It captures live video, processes it with a TensorFlow Lite model to detect specific objects, and saves important events as video files."
summary: "This project builds a real-time object detection system using a Raspberry Pi and a camera. It captures live video, processes it with a TensorFlow Lite model to detect specific objects, and saves important events as video files."
date: 2024-02-21
lastmod: 2024-06-05
featureAlt: "Flint Lockwood Spray-On Shoes"
coverAlt: "Flint Lockwood Spray-On Shoes"
thumbnailAlt: "Flint Lockwood Spray-On Shoes"
categories: ["software", "hardware"]
tags: ["raspberry-pi", "opencv", "flask", "gpio", "parallel-computing", "real-time-object-detection", "tensorflow-lite", "store-management", "debian-bullseye", "efficientdet-lite"]
---
This project builds a **real-time object detection** system using a **Raspberry Pi** and a camera. It captures live video, processes it with a **TensorFlow Lite** model to detect specific objects, and saves important events as video files. To handle these tasks efficiently, it uses **parallel computing** with threading. The system provides visual alerts through LEDs and sound alerts via a buzzer, showcasing its capability **to control real-world actions**, which can also be extended to manage circuits or send signals. A local network server is created for **real-time monitoring**, enabling users to view live video, access saved recordings, and review logs seamlessly.

- **Real-Time Object Detection:** Detects objects in real-time using a TensorFlow Lite model.
- **Parallel Computing:** Use threading for efficient processing and real-time performance.
- **LED and Buzzer Integration:** Provides visual and auditory notifications for detected events and can be extended to control circuits or send signals.
- **Safe Zone Detection:** Configures a virtual safe zone within the camera's field of view. When an object enters or leaves this predefined area, the system triggers alerts and records the event.
- **Event Recording:** Records video segments when an object is detected.
- **Storage Management:** Monitors and manages storage capacity, automatically deleting old events when necessary.
- **Web Interface:** Creates a local network server to stream live video, view saved recordings, and access event logs. Users can monitor live footage, browse archived video segments, and view logs through the web interface.

An alternative name of this project is [FLDSMDFR](https://github.com/dafmontenegro/pi-tensorflow-lite-object-detection/blob/master/audio/FLDSMDFR_pi-tensorflow-lite-object-detection.mp3):
- **F**: Flask
- **L**: Lightweight
- **D**: Detection
- **S**: System
- **M**: Machine Learning
- **D**: Device
- **F**: Fast
- **R**: Recognition

## Repository

- [GitHub](https://github.com/dafmontenegro/pi-tensorflow-lite-object-detection)

## 1. General Specifications
This repository presents a demonstration of real-time object detection on a **Raspberry Pi** using **TensorFlow Lite**. Inspired by the official **TensorFlow examples library** [1] and the video tutorials by **Paul McWhorter** [2], this project provides a hands-on exploration of object detection capabilities on resource-constrained devices like the **Raspberry Pi platform**.

### 1.1 Requirements
- Python 3.x
- OpenCV
- Flask
- TensorFlow Lite
  - **Model:** efficientdet_lite0.tflite

### 1.2 Software:
- **OS:** Debian Bullseye

### 1.3 Hardware:
- **Board:** Raspberry Pi 4 Model B Rev 1.2
- **Webcam:** Logitech C270 HD

## 2. Usage

### 2.1 Run the System
Execute the script with the following command:

```bash
python pi_tensorflow_lite_object_detection.py --folder-name "events" --log-file "logfile.log"
```

- `--folder-name`: Name of the folder to store events (default: "events").
- `--log-file`: Name of the log file (default: "logfile.log").
- `--reset-events`: Reset events folder.
- `--reset-logs`: Reset log file.

---

### 2.2 Access the Web Interface
Open a web browser and navigate to `http://<your_raspberry_pi_ip>/` or `http://<your_hostname>/`. The following endpoints are available:

- `/`: Streams real-time video from the camera.
- `/logs/`: Displays the log file.
- `/events/`: Shows a list of recorded events.
- `/play/<path:video_path>`: Plays a specific recorded video.

## 3. Demo

Based on **Google AI for Developers** [3], we will reference a section that provides further details about the model used in the project.

*"The **EfficientDet-Lite0** model uses an EfficientNet-Lite0 backbone with a 320x320 input size and BiFPN feature network. The model was trained with the [**COCO dataset**](https://cocodataset.org/#home), a large-scale object detection dataset that contains 1.5 million object instances and [**80 object labels**](https://storage.googleapis.com/mediapipe-tasks/object_detector/labelmap.txt)."* [3]

What this means is that the project can recognize up to 80 different types of objects, so to better demonstrate this, videos were recorded featuring some of them. You can watch them for a better understanding:

### 3.1 Human detector
👤 Click [here](https://github.com/dafmontenegro/pi-tensorflow-lite-object-detection/blob/master/videos/human_pi-tensorflow-lite-object-detection.mp4) to be redirected to the video.

### 3.2 Banana detector
🍌 Click  [here](https://github.com/dafmontenegro/pi-tensorflow-lite-object-detection/blob/master/videos/banana_pi-tensorflow-lite-object-detection.mp4) to be redirected to the video

### 3.3 Cat detector
😸 Click [here](https://github.com/dafmontenegro/pi-tensorflow-lite-object-detection/blob/master/videos/cat_pi-tensorflow-lite-object-detection.mp4) to be redirected to the video

## 4. Code

### 4.1 class LEDRGB and class LEDSRGB

```python
class LEDRGB:
    colors = {
        "red": (1, 0, 0),
        "green": (0, 1, 0),
        "blue": (0, 0, 1),
        "yellow": (1, 1, 0),
        "magenta": (1, 0, 1),
        "cyan": (0, 1, 1),
        "white": (1, 1, 1),
        "off": (0, 0, 0)
    }

    def __init__(self, red_led, green_led, blue_led):
        GPIO.setmode(GPIO.BCM)
        self.red_led = red_led
        self.green_led = green_led
        self.blue_led = blue_led
        GPIO.setup(self.red_led, GPIO.OUT)
        GPIO.setup(self.green_led, GPIO.OUT)
        GPIO.setup(self.blue_led, GPIO.OUT)
    
    def _set_color(self, color_name):
        color = self.colors.get(color_name.lower(), self.colors["off"])
        GPIO.output(self.red_led, color[0])
        GPIO.output(self.green_led, color[1])
        GPIO.output(self.blue_led, color[2])

    def __getattr__(self, color_name):
        return lambda: self._set_color(color_name)

class LEDSRGB:
    def __init__(self, leds):
        self.leds = [LEDRGB(*led) for led in leds]
    
    def set_color(self, color_names):
        if isinstance(color_names, str):
            for i, led in enumerate(self.leds):
                getattr(led, color_names)()
        elif isinstance(color_names, list) and len(color_names) == len(self.leds):
            for (led, color) in zip(self.leds, color_names):
                getattr(led, color)()
    
    def __getattr__(self, color_name):
        return lambda: self.set_color(color_name)
```

### 4.2 class Buzzer
```python
class Buzzer:
    def __init__(self, pin=12, frequency=5000, duty_cycle=50):
        self.pin = pin
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(self.pin, GPIO.OUT)
        self.frequency = frequency
        self.pwm = GPIO.PWM(self.pin, self.frequency)
        self.duty_cycle = duty_cycle
        self.active = False

    def auto_stop(self, cycles=3, duration=0.1):
        if not self.active:
            self.active = True
            for _ in range(cycles):
                self.start()
                time.sleep(duration)
                self.stop()
                time.sleep(duration)
            self.active = False
    
    def start(self):
        self.pwm.start(self.duty_cycle)
    
    def stop(self):
        self.pwm.stop()
```

### 4.3 class ObjectDetector and class Camera
```python
class ObjectDetector:
    def __init__(self, model_name="efficientdet_lite0.tflite", num_threads=4, score_threshold=0.3, max_results=1, category_name_allowlist=["person"]):
        base_options = core.BaseOptions(file_name=model_name, use_coral=False, num_threads=num_threads)
        detection_options = processor.DetectionOptions(max_results=max_results, score_threshold=score_threshold, category_name_allowlist=category_name_allowlist)
        options = vision.ObjectDetectorOptions(base_options=base_options, detection_options=detection_options)
        self.detector = vision.ObjectDetector.create_from_options(options)

    def detections(self, image):
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        return self.detector.detect(vision.TensorImage.create_from_array(rgb_image)).detections

class Camera:
    def __init__(self, frame_width=1280, frame_height=720, camera_number=0):
        self.video_capture = cv2.VideoCapture(camera_number)
        self.video_capture.set(cv2.CAP_PROP_FRAME_WIDTH, frame_width)
        self.video_capture.set(cv2.CAP_PROP_FRAME_HEIGHT, frame_height)

    def frame(self):
        _, frame = self.video_capture.read()
        return frame
```

### 4.4 class RealTimeObjectDetection
```python
class RealTimeObjectDetection:
    def __init__(self, frame_width=1280, frame_height=720, camera_number=0, model_name="efficientdet_lite0.tflite", num_threads=4, score_threshold=0.3, max_results=1, category_name_allowlist=["person"], 
                 folder_name="events", storage_capacity=32, led_pines=[(13, 19, 26), (21, 20, 16)], pin_buzzer=12, frequency=5000, duty_cycle=50, fps_frame_count= 30, safe_zone=((0, 0), (1280, 720))):
        self.frame_width = frame_width
        self.frame_height = frame_height
        self.camera = Camera(frame_width, frame_height, camera_number)
        self.frame = self.camera.frame()
        self.object_detector = ObjectDetector(model_name, num_threads, score_threshold, max_results, category_name_allowlist)
        self.folder_name = folder_name
        self.storage_manager = StorageManager(folder_name, storage_capacity)
        self.storage_manager.supervise_folder_capacity()
        self.leds_rgb = LEDSRGB(led_pines)
        self.buzzer = Buzzer(pin_buzzer, frequency, duty_cycle)
        self.safe_zone_start, self.safe_zone_end = safe_zone
        self.fps_frame_count = fps_frame_count
        self.last_detection_timestamp = None
        self.frame_buffer = []
        self.frame_times = []
        self.output = {}
        self.events = 0
        self.fps = 24

    def guard(self, min_video_duration=1, max_video_duration=60, max_detection_delay=10, event_check_interval=10, safe_zone=False):
        try:
            self.buzzer.auto_stop()
            self.leds_rgb.set_color(["off", "green"])
            while self.isOpened():
                security_breach, time_localtime = self.process_frame((0, 0, 255), 1, 2, cv2.FONT_HERSHEY_SIMPLEX, safe_zone)
                if security_breach:
                    if not self.frame_buffer:
                        self.output["file_name"] = time.strftime("%B%d_%Hhr_%Mmin%Ssec", time_localtime)
                        self.output["day"], self.output["hours"], self.output["mins"] = self.output["file_name"].split("_")
                        self.output["path"] = os.path.join(self.folder_name, self.output["day"], self.output["hours"], f"{self.output['file_name']}.mp4")
                    elif len(self.frame_buffer) == int(self.fps):
                        buzzer_thread = threading.Thread(target=self.buzzer.auto_stop)
                        buzzer_thread.start()
                        self.leds_rgb.red()
                    self.last_detection_timestamp = time.time()
                    self.frame_buffer.append(self.frame)
                else:
                    if self.last_detection_timestamp and ((time.time() - self.last_detection_timestamp) >= max_detection_delay):
                        if len(self.frame_buffer) >= self.fps*min_video_duration:
                            self.save_frame_buffer(self.output["path"], event_check_interval)
                        self.leds_rgb.set_color(["off", "green"])
                        self.last_detection_timestamp = None
                        self.frame_buffer = []
                        self.output = {}
                    elif len(self.frame_buffer) >= self.fps*max_video_duration:
                        self.save_frame_buffer(self.output["path"], event_check_interval)
        except Exception as e:
            logging.error(e, exc_info=True)
            GPIO.cleanup()
            self.close()
            os._exit(0)
    
    def save_frame_buffer(self, path, event_check_interval=10):
        output_seconds = int(len(self.frame_buffer)/self.fps)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        out = cv2.VideoWriter(path, cv2.VideoWriter_fourcc(*"avc1"), self.fps, (self.frame_width, self.frame_height))
        logging.warning(f"EVENT: {output_seconds} seconds {path}")
        for frame in self.frame_buffer:
            out.write(frame)
        out.release()
        self.events += 1
        if self.events % event_check_interval == 0:
            storage_thread = threading.Thread(target=self.storage_manager.supervise_folder_capacity)
            storage_thread.start()
    
    def _safe_zone_invasion(self, rect_start, rect_end):
        if self.safe_zone_start[0] > rect_end[0] or self.safe_zone_end[0] < rect_start[0]:
            return False
        if self.safe_zone_start[1] > rect_end[1] or self.safe_zone_end[1] < rect_start[1]:
            return False
        return True

    def process_frame(self, color=(0, 0, 255), font_size=1, font_thickness=2, font=cv2.FONT_HERSHEY_SIMPLEX, safe_zone=False):
        security_breach = False
        start_time = time.time()
        frame = self.camera.frame()
        time_localtime = time.localtime()
        detections = self.object_detector.detections(frame)
        for detection in detections:
            box = detection.bounding_box
            rect_start = (box.origin_x, box.origin_y)
            rect_end = (box.origin_x+box.width, box.origin_y+box.height)
            category_name = detection.categories[0].category_name
            text_position = (7+box.origin_x, 21+box.origin_y)
            cv2.putText(frame, category_name, text_position, font, font_size, color, font_thickness)
            cv2.rectangle(frame, rect_start, rect_end, color, font_thickness)
            security_breach = self._safe_zone_invasion(rect_start, rect_end)
        cv2.putText(frame, time.strftime("%B%d/%Y %H:%M:%S", time_localtime), (21, 42), cv2.FONT_HERSHEY_SIMPLEX, font_size, color, font_thickness)
        if safe_zone:
            cv2.rectangle(frame, self.safe_zone_start, self.safe_zone_end, (0, 255, 255), font_thickness)
        self.frame = frame
        self.frame_times.append(time.time() - start_time)
        if self.fps_frame_count == len(self.frame_times):
            average_frame_time = sum(self.frame_times) / len(self.frame_times)
            self.fps = round(1/average_frame_time, 2)
            self.frame_times = []
        return security_breach, time_localtime

    def isOpened(self):
        return self.camera.video_capture.isOpened()
    
    def close(self):
        self.camera.video_capture.release()
```

### 4.5 class StorageManager
```python
class StorageManager:
    def __init__(self, events_folder="events", storage_capacity=32):
        self.events_folder = events_folder
        self.storage_capacity = storage_capacity

    @staticmethod
    def folder_size_gb(folder_path):
        total_size_bytes = 0
        for dirpath, _, filenames in os.walk(folder_path):
            for filename in filenames:
                file_path = os.path.join(dirpath, filename)
                total_size_bytes += os.path.getsize(file_path)
        return total_size_bytes / (1024 ** 3)
    
    @staticmethod
    def delete_folder(folder_path):
        folder_size = StorageManager.folder_size_gb(folder_path)
        shutil.rmtree(folder_path)
        logging.warning(f"STORAGE: '{folder_path}' was deleted (-{folder_size:.4f} GB)")
        return folder_size

    def supervise_folder_capacity(self):
        events_folder_size = StorageManager.folder_size_gb(self.events_folder)
        logging.info(f"STORAGE: '{self.events_folder}' is ({events_folder_size:.4f} GB)")
        while events_folder_size > self.storage_capacity:
            folder_to_delete = os.path.join(self.events_folder, min(os.listdir(self.events_folder)))
            events_folder_size -= StorageManager.delete_folder(folder_to_delete)
```

### 4.6 Initial Configuration
```python
remote_camera = RealTimeObjectDetection(
    frame_width=1280,
    frame_height=720,
    camera_number=0,
    model_name="efficientdet_lite0.tflite",
    num_threads=4,
    score_threshold=0.5,
    max_results=3, 
    category_name_allowlist=["person", "dog", "cat", "umbrella"],
    folder_name=folder_name,
    storage_capacity=32,
    led_pines=[(13, 19, 26), (16, 20, 21)],
    pin_buzzer=12,
    frequency=5000,
    duty_cycle=50,
    fps_frame_count=30,
    safe_zone=((0, 180), (1280, 720))
)

guard_thread = threading.Thread(target=remote_camera.guard, kwargs={
    "min_video_duration": 1,
    "max_video_duration": 60,
    "max_detection_delay": 10,
    "event_check_interval": 10,
    "safe_zone": True
})

guard_thread.start()
```

## 5. Contributing
Contributions to **FLDSMDFR** (the alternative name for the project) are welcome from developers, researchers, and enthusiasts interested in real-time object detection, parallel computing, and Raspberry Pi applications. We encourage collaborative efforts to enhance the system's features, optimize performance, and improve usability.

## 6. References
[1] [TensorFlow Lite Python object detection example with Raspberry Pi](https://github.com/tensorflow/examples/tree/master/lite/examples/object_detection/raspberry_pi)

[2] [Raspberry Pi LESSON 63: Object Detection on Raspberry Pi Using Tensorflow Lite](https://www.youtube.com/watch?v=yE7Ve3U5Slw)

[3] [Object detection task guide | Google AI For Developers](https://ai.google.dev/edge/mediapipe/solutions/vision/object_detector#configurations_options)