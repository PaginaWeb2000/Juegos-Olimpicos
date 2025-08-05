const Airtable = require('airtable');

// Configuración de Airtable
const AIRTABLE_PERSONAL_ACCESS_TOKEN = 'patj8egTyQiP5yREK.111bbc1cc68e8e25c5a02bd73b8d839a9fb541b51ca07f630f8b63646e89c56d';
const AIRTABLE_BASE_ID = 'appzZSE6DQZRc9uqt';
const AIRTABLE_TABLE_NAME = 'Participantes';

const base = new Airtable({ 
  apiKey: AIRTABLE_PERSONAL_ACCESS_TOKEN 
}).base(AIRTABLE_BASE_ID);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Método no permitido' };
  }

  try {
    const data = JSON.parse(event.body);
    const table = base(AIRTABLE_TABLE_NAME);

    // Limpiar la tabla primero
    const records = await table.select().firstPage();
    const deletePromises = records.map(record => table.destroy(record.id));
    await Promise.all(deletePromises);

    // Insertar nuevos registros
    const createPromises = data.map(participant => 
      table.create({
        'Name': participant.name,
        'Gold': participant.gold || 0,
        'Silver': participant.silver || 0,
        'Bronze': participant.bronze || 0
      })
    );

    await Promise.all(createPromises);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Datos guardados correctamente' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error al guardar en Airtable', error: error.message })
    };
  }
};