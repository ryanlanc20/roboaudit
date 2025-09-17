# Roboaudit - An API for managing your LLM usage audits
Roboaudit allows you to store audit logs for prompt-response pairs, allowing you to preserve chat history and your response evaluations.
Whether you're tracking your prompt engineering improvements over time as an individual, or evaluating the strengths and weaknesses of different AI chatbots
to enable better organisational decision making, Roboaudit has you covered! The great thing about Roboaudit is that it's just an API, and it has no authentication. This means that
you can integrate it into your existing systems, developing a UI view in your existing codebase, and utilizing your existing auth system. Your users will not need to keep track
of multiple credentials, and they will always be presented with a familiar user interface!

## Getting started
You can either download the Roboaudit source and run it using Node.js, build the source into an executable, or simply download the pre-built release executable.
Each step is detailed below:

### Create a .env file for Roboaudit
Roboaudit uses MySQL to store audit data. You will need to have a MySQL database running somewhere for Roboaudit to work! You will also need to define
database credentials in a .env file. You should include these key-value pairs in the file:
* DATABASE_NAME=[DB_NAME_HERE]
* DATABASE_USER=[DB_USER_HERE]
* DATABASE_PASS=[DB_PASS_HERE]
* DATABASE_HOST=[DB_HOST_HERE]
* PORT=[SERVER_PORT_NUMBER]

You will also need to create a database with a name of your choosing on your MySQL server and update the .env file accordingly.

### Download the Roboaudit source (assumes you have Node.js installed)
Download the source from https://github.com/ryanlanc20/roboaudit onto your computer, and place the folder in a directory of your choosing.

Open your terminal window (command prompt on windows)

Make sure to ```cd``` into the source folder

Copy your .env file into this folder.

Type ```npm install```

If you want to start the application straight away, type ```npm start```

Note: Downloading the main source can be risky, since bugs might accidently be pushed to the main branch. Unless you want to experiment
with brand new features and are willing to take the risk, please download the latest source code release instead from https://github.com/ryanlanc20/roboaudit/releases

### Building from source (assumes you have Node.js and have completed the previous step)
To build from source, run the following command from within the source folder:

```npm build```

Three executable files will appear in the folder, for Windows, MacOS, and Linux. Choose the right
executable for your platform and start it!

### Downloading the release executable
Navigate to https://github.com/ryanlanc20/roboaudit/releases and select the latest executable for your platform.

Download to a folder of your choice, and make sure your .env file is in the same folder!

## API documentation (v1.0.0)
### [GET] /audits/:offset/:limit - Retrieves audits using pagination parameters
  * PARAMS
    * offset[int >= 0] : Index of first result (i.e., pagenum * resultsperpage)
    * limit[int >= 1] : Maximum number of results to return (i.e., 10, 25, 50, 100)
  * RESPONSE (200 OK)
    ```json
      {
        "msg": string,
        "data": [
          {
            "id": uuidv4,
            "prompt": string,
            "response": string,
            "createdAt": date,
            "updatedAt": date,
            "RubricRating": {
              "truthfulness": oneof("CORRECT", "MINOR_ERRORS", "MAJOR_ERRORS"),
              "detail": oneof("TOO_SHORT", "BALANCED", "TOO_LONG"),
              "safety": oneof("SAFE", "UNSAFE"),
              "quality": oneof("BAD", "OKAY", "GOOD", "EXCELLENT")
            }
          },
          ...
        ],
        "total_audits": int
      }
    ```
  * EXCEPTIONS
    * [404] Audits not found - {"msg": string}
    * [500] Internal server error - {"msg": string}
### [GET] /audit/:id - Retrieves the specified audit
  * PARAMS
    * id[uuidv4] : ID of audit to fetch
  * RESPONSE (200 OK)
    ```json
      {
        "msg": string,
        "data": {
          "id": uuidv4,
          "prompt": string,
          "response": string,
          "createdAt": date,
          "updatedAt": date,
          "RubricRating": {
            "truthfulness": oneof("CORRECT", "MINOR_ERRORS", "MAJOR_ERRORS"),
            "detail": oneof("TOO_SHORT", "BALANCED", "TOO_LONG"),
            "safety": oneof("SAFE", "UNSAFE"),
            "quality": oneof("BAD", "OKAY", "GOOD", "EXCELLENT")
          }
        }
      }
    ```
  * EXCEPTIONS
    * [404] Audit not found - {"msg": string}
    * [500] Internal server error - {"msg": string}
### [POST] /audit - Create audit
  * BODY
    ```json
      {
        "prompt": string,
        "response": string,
        "truthfulness": oneof("CORRECT", "MINOR_ERRORS", "MAJOR_ERRORS"),
        "detail": oneof("TOO_SHORT", "BALANCED", "TOO_LONG"),
        "safety": oneof("SAFE", "UNSAFE"),
        "quality": oneof("BAD", "OKAY", "GOOD", "EXCELLENT")
      }
    ```
  * RESPONSE (200 OK)
    ```json
      {
        "msg": string,
        "data": {
          "id": uuidv4,
          "prompt": string,
          "response": string,
          "createdAt": date,
          "updatedAt": date,
          "RubricRating": {
            "truthfulness": oneof("CORRECT", "MINOR_ERRORS", "MAJOR_ERRORS"),
            "detail": oneof("TOO_SHORT", "BALANCED", "TOO_LONG"),
            "safety": oneof("SAFE", "UNSAFE"),
            "quality": oneof("BAD", "OKAY", "GOOD", "EXCELLENT")
          }
        }
      }
    ```
  * EXCEPTIONS
    * [500] Internal server error - {"msg": string}
### [PATCH] /audit/:id - Edit a particular audit
  * PARAMS
    * id[uuidv4] : ID of audit to edit
  * BODY
    ```json
      {
        "truthfulness": oneof("CORRECT", "MINOR_ERRORS", "MAJOR_ERRORS"),
        "detail": oneof("TOO_SHORT", "BALANCED", "TOO_LONG"),
        "safety": oneof("SAFE", "UNSAFE"),
        "quality": oneof("BAD", "OKAY", "GOOD", "EXCELLENT")
      }
    ```
  * RESPONSE (200 OK)
    ```json
      {
        "msg": string,
        "data": {
          "truthfulness": oneof("CORRECT", "MINOR_ERRORS", "MAJOR_ERRORS"),
          "detail": oneof("TOO_SHORT", "BALANCED", "TOO_LONG"),
          "safety": oneof("SAFE", "UNSAFE"),
          "quality": oneof("BAD", "OKAY", "GOOD", "EXCELLENT")
        }
      }
    ```
  * EXCEPTIONS
    * [404] Audit not found - {"msg": string}
    * [500] Internal server error - {"msg": string}
### [DELETE] /audit/:id - Delete a particular audit
  * PARAMS
    * id[uuidv4] : ID of audit to delete
  * RESPONSE (200 OK)
    ```json
      {
        "msg": string,
        "data": {
          "id": string
        }
      }
    ```
  * EXCEPTIONS
    * [404] Audit not found - {"msg": string}
    * [500] Internal server error - {"msg": string}