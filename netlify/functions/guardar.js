const fs = require("fs");
const path = require("path");

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: "Método no permitido",
        };
    }

    const data = JSON.parse(event.body);
    // Guardar el archivo en /tmp (único lugar permitido en Netlify Functions)
    const filePath = "/tmp/participantes.json";

    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Datos guardados correctamente" }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Error al guardar los datos" }),
        };
    }
};
