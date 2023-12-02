# HeroHub

## Description
HeroHub is a web-based platform designed for Marvel enthusiasts to explore the extensive world of Marvel heroes. Leveraging the Marvel API, HeroHub provides users with detailed information about characters, stories, and more, all in one centralized hub. The platform offers an interactive and engaging experience, catering to both long-time Marvel fans and newcomers.

## Features
- **Character Search**: Utilize the Marvel API to search for and explore detailed information about Marvel characters.
- **Rating Characters**: Users can rate characters, sharing their opinions with the community.
- **Bookmarking Characters**: Save your favorite characters to your profile for quick access later.
- **Story of the Day**: Discover a new story from the Marvel Universe every day.
- **Hero Metrics**: View user data across the platform such as insights on the highest and lowest rated characters.
- **Edit Profile**: Personalize your user profile to enhance your experience on HeroHub.
- **Analytics**: Access charts and analytics specific to your interactions on the platform.
- **Support Page**: Find help and assistance on our dedicated support page.

## Installation

### Clone the Repository
Clone the repository to your local device:
`git clone [<repository-url>](https://github.com/herohubUVA/herohub2.0.git)https://github.com/herohubUVA/herohub2.0.git`

### Navigate to the Directory:
Navigate to the directory you have cloned Hero Hub to.

### Install Dependencies
Install the required dependencies:
`npm install`

### Extra
- Make sure that Google Cloud SDK is installed and configured for deployment.

## Setup

### Set Up Environment Variables
Create a `.env` file in the root directory of the project and add the necessary credentials for the Marvel API, Google Auth, and your local database settings. Your `.env` file should include the following variables:
```
DB_USER=yourLocalDbUsername
DB_PASS=yourLocalDbPassword
DB_NAME=yourLocalDbName
GOOGLE_CLIENT_ID=yourGoogleClientId
GOOGLE_CLIENT_SECRET=yourGoogleClientSecret
MARVEL_PUBLIC_KEY=yourMarvelPublicKey
MARVEL_PRIVATE_KEY=yourMarvelPrivateKey
SESSION_SECRET=yourSessionSecret
```

### Start the Application
Run the application in the root directory:
`npm start`

## Deploying Hero Hub on Google Cloud Platform

### Set up Google Cloud Platform Environment Variables (if necessary)
To do this, navigate to the App Engine section on the Google Cloud Console.

### Configure app.yaml
Make sure the `app.yaml` file has the necessary settings to deploy, including environment variables, settings for the cloud SQL instance, handling all the static content, etc.

### Build the Application (if necessary)
`npm run build`

### Deploy to App Engine
`gcloud app deploy`


Once deployed, the URL for the application should be provided by the App Engine in the console.


## License
HeroHub is MIT licensed.

