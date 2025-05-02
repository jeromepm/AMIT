# A.M.I.T. A Multiclassification Image Tool
<img src="https://raw.githubusercontent.com/jeromepm/AMIT/refs/heads/main/static/AMIT.jpg" width=50% height=50%>

## Overview
**A.M.I.T.** is a tool designed to create images from a local network of IP cameras and create a personal image classification model. I've chosen multi-classification for its speed compared to object detection on smaller systems like Raspberry Pi's. It is also easier to create the dataset as there's only boxes to be checked not to be drawn. There are several tools out there for object detection, but most are, I feel, overly complicated for a simple task.

## Installation
#### Docker
One option is to download the docker image. This method may not allow you to connect to your IP Cameras if your docker network isn't setup to allow containers into the local network. In this instance, you will need to manually upload images into the folders for classification. 
```
docker pull jeromepm/amit
docker run -d -p <PORT>:8286
```
Verify the image:
```
sha256:a89a421b77174214f98812fd9b4afa58049cd5dc8c71827b50f51603e1585a07
```

If you would like access to the images and files, you will need to mount a volume to the data directory.

```
docker run -d -p <PORT>:8086 --volume <volume-name>:/data
```

#### Git
You can also clone this repository and run it directly. 

```
git clone
https://github.com/jeromepm/amit.git
cd amit
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

## Configuration
The only configuration option currently is the port that it listens on and the timezone for which the timestamps are derived from.


## Usage
This tool is designed to make image classification easy and more user-friendly. 

1. Create a project. 
  - Give it a name and a short description 
  - Select the control label name and create your own labels
  - Create sources using your home IP cameras with RTSP enabled or and internal hosting tool
    - *This is not needed if you plan on uploading images manually.*
2. Create a schedule
  - Select the times of day and frequency to pull images from the sources.
  - The schedule will place the images in a folder to choose what is in it
3. Move Images
  - The images will either have "nothing" or something. Select which and finish what's in the folder.
4. Label Images
  - Images that have something in them will need to be labeled. You can check the box of the labels that are in the image. Select as many as are relevant.  
5. Download the Project
  - You can then download the project as a pickle file with or without numpy arrays of the images. The file can then be used directly with a predefined model for [transfer learning and fine-tuning](https://www.tensorflow.org/tutorials/images/transfer_learning) or converted to a [TFRecord](https://www.tensorflow.org/tutorials/load_data/tfrecord) file to include in another, larger project.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
