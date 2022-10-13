
# Map Pool bot

This bot was made for the Team Matchmaker team, its supposed to assist with organizing and sorting map submissions from our mappers and the community.

## Commands
|       Usage         |Effect                         |
|----------------|-------------------------------|
|`submit <pool> <name> <description>`| submits a map, this creates a new forum thread in the specified forum |
|`remove <pool> <name>`| deletes a submission, removes forum thread and wipes the database entry|

### Requirements:
- `Node js`
- `Discord js`
- `http`
- `https`
- `mkdirp`
- `sequelize`
- `sqlite3`

### Setup
Create a config.json file based on the example-config.json:
- `add client id`
- `add token id`
- `add guild id`
- `edit channel ids inside the command files`

- run `node deploy-commands.js`

to run the bot simply run `node index.js`
