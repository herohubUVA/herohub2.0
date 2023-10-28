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
1. Clone the repository to your local device:
git clone [<repository-url>](https://github.com/herohubUVA/herohub2.0.git)https://github.com/herohubUVA/herohub2.0.git

2. Navigate to the HeroHub directory:
cd HeroHub

3. Install the required dependencies:
npm install

## Setup
1. Create a .env file in the root directory of the project, and add the necessary credentials for the Marvel API and Google Auth. Your .env file should include the following:
DB_USER=
DB_PASS=
DB_NAME=
INSTANCE_UNIX_SOCKET=
GOOGLE_CLIENT_ID =
GOOGLE_CLIENT_SECRET = 
MARVEL_PUBLIC_KEY =
MARVEL_PRIVATE_KEY=
SESSION_SECRET=

2. Start the application:
npm start

To log in or sign up, ensure that your current IP is registered under the list of Authorized Networks on Google Cloud Platform (GCP) for HeroHub. Alternatively, you can navigate manually as a guest by searching for http://localhost:4000/Home in your browser's search bar.

## License
HeroHub is MIT licensed.

