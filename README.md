# CSP Project (Shamir Secret Sharing)

## By Alfred Daimari

### About

Shamir's Secret Sharing (SSS) is used to secure a secret in a distributed way, most often to secure other encryption keys. The secret is split into multiple parts, called shares. These shares are used to reconstruct the original secret.

To unlock the secret via Shamir's secret sharing, a minimum number of shares are needed. This is called the threshold, and is used to denote the minimum number of shares needed to unlock the secret. An adversary who discovers any number of shares less than the threshold will not have any additional information about the secured secret-- this is called perfect secrecy.

_source - wikipedia_

### Directory Structure

- src: app.js(for setting up express server), index.js(for listening on port 9696), shamir.js(contains classes that setup shamir's secret sharing), socket.js (sets up socket server for secret sharing)

- public: main.js (client-side file for setting up socket connections), create.html (for creating a new room), join.html (for joining someone else's room), secret.html (page where secret sharing and secret forging is done)

### How to Access it on WWW

- http:// not up yet
