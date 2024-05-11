const path = require("path")
const fs = require("fs")

function readMessage (folder, file) {
    const pathFile = path.join(__dirname, folder, file)
    return fs.readFileSync(pathFile, "utf8")
}

module.exports = { readMessage }