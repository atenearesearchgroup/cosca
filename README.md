# Server side of automatic Air Conditioning temperature adjusting system utilising Digital Avatars

## File list

- "server.js" is the server configuration file where the URLs and ports are defined.
- "api" folder contains the node.js code with the server functionality, found in acController.js file. This is the core part of the web application where the main app logic is executed.
- "Uncertainty" folder contains both Java and Javascript versions of the uncertainty classes that handles the operations with uncertainty data types.
- "Script" folder contains the BeanShell script that is downloaded by the Android app to be executed on the Digital Avatar application.

## How it works

This application deploys a server that will be listening to petitions to download the beanshell script "ACScript.bsh". The Android application executes this script to send their preferred temperature to the server. The server then calculates an average of the preferred temperatures of all the registered users and sets the air conditioner temperature to that value. Several parameters such as distance to the ac machine, signal strength and time since last update affect how the values are weighted.
