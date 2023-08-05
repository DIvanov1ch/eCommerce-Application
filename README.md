# eCommerce-Application

Welcome to our eCommerce application! This platform replicates real-world shopping experiences in a digital environment 🏪. It's a comprehensive online shopping portal that provides an interactive and seamless experience to users. From product discovery to checkout, the application ensures a smooth journey for the user, enhancing their engagement and boosting their purchasing confidence 🚀.

Users can browse through a vast range of products 📚👗👟, view detailed descriptions, add their favorite items to the basket 🛒, and proceed to checkout 💳. It includes features such as user registration and login 📝🔐, product search 🔍, product categorization, and sorting to make the shopping experience more streamlined and convenient.

An important aspect of our application is that it's responsive 📲, ensuring it looks great on various devices with a minimum resolution of 390px. This feature makes the shopping experience enjoyable, irrespective of the device users prefer.

Key pages in the application include:

- Login and Registration pages 🖥️
- Main page 🏠
- Catalog Product page 📋
- Detailed Product page 🔎
- User Profile page 👤
- Basket page 🛒
- About Us page 🙋‍♂️🙋‍♀️

The application is powered by CommerceTools 🌐, a leading provider of commerce solutions for B2C and B2B enterprises. CommerceTools offers a cloud-native, microservices-based commerce platform that enables brands to create unique and engaging digital commerce experiences.

Setup and Usage:

- Clone this repo to your desktop by `git clone https://github.com/DIvanov1ch/eCommerce-Application.git`.
- Install Node.js if you haven’t got it already. [Node.js](https://nodejs.org)
- Go to application root directory and run `npm install` or `npm i` to install its dependencies.
- Once the dependencies are installed, you can run `node src/index.ts` to start the application or `npm run build` to build the bundle of application in dist directory.

Scripts usage:

- `npm run test` - runs Jest tests, streamlining the process of executing tests and generating reports on test outcomes.
- `npm run build`- enables production mode for webpack and node. Our bundles are as small as possible.
- `npm run build:dev` - enables development mode for webpack with useful names for modules and chunks.
- `npm run build:prod` - enables production mode for webpack and node. Our bundles are as small as possible.
- `npm run watch` - enables watch-mode, webpack will keep watching for any changes we make in our code and once we save the changes, it will rerun by itself to rebuild the package.
- `npm run serve` – runs webpack with a development server that provides live reloading. This should be used for development only.
- `npm run prepare` – install husky hooks automatically.
- `npm run lint` - runs ESLint across the codebase, making it possible to quickly and efficiently identify code style issues and potential errors.
- `npm run lint:fix` - runs ESLint across the codebase, making it possible to quickly and efficiently identify code style issues and fix potential errors.
- `npm run format` - runs Prettier across the codebase, simplifying code formatting and ensuring uniform code style.
- `npm run format:fix` - runs Prettier across the codebase, simplifying code formatting, ensuring uniform code style and fixing potential errors.
- `lint-format:fix` - runs ESLint across the codebase, making it possible to quickly and efficiently identify code style issues and fix potential errors, after that runs Prettier across the codebase, simplifying code formatting, ensuring uniform code style and fixing potential errors.
