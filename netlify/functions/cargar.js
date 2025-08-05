const Airtable = require('airtable');

// Configuración de Airtable
const AIRTABLE_PERSONAL_ACCESS_TOKEN = 'patj8egTyQiP5yREK.111bbc1cc68e8e25c5a02bd73b8d839a9fb541b51ca07f630f8b63646e89c56d';
const AIRTABLE_BASE_ID = 'appzZSE6DQZRc9uqt';
const AIRTABLE_TABLE_NAME = 'Participantes';

const base = new Airtable({ 
  apiKey: AIRTABLE_PERSONAL_ACCESS_TOKEN 
}).base(AIRTABLE_BASE_ID);

exports.handler = async () => {
  try {
    const records = await base(AIRTABLE_TABLE_NAME).select().firstPage();
    const participants = records.map(record => ({
      name: record.get('Name') || '',
      gold: record.get('Gold') || 0,
      silver: record.get('Silver') || 0,
      bronze: record.get('Bronze') || 0
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ data: participants })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error al cargar desde Airtable', error: error.message })
    };
  }
};