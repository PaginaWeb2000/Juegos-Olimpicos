const fs = require("fs");
const path = require("path");

exports.handler = async () => {
    // Leer el archivo desde /tmp (único lugar permitido en Netlify Functions)
    const filePath = "/tmp/participantes.json";

    try {
        const contenido = fs.readFileSync(filePath, "utf8");
        return {
            statusCode: 200,
            body: JSON.stringify({ data: JSON.parse(contenido) }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Error al cargar los datos" }),
        };
    }
};
