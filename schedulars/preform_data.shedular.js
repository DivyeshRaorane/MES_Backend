import cron from 'node-cron';
import { syncPreformData } from '../services/preform_data/preform_data.service.js';

export const startShedular = ()=>{
    cron.schedule('*/15 * * * *', async()=>{
        console.log('Running Schedular....');
        await syncPreformData();
    });

    console.log(
        'Preform Sheduar started (every 15 min)'
    );

};

