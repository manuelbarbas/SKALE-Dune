import axios from 'axios';
import dotenv from 'dotenv'; 
dotenv.config();


const api_key = process.env.API_KEY;
const dune_endpoint = process.env.DUNE_ENDPOINT || "";
const skale_endpoint = process.env.SKALE_ENDPOINT || "";
const queries_ids_to_update = [3235318,3237360,3238173,3237389,3237392,3237393,3237477,3238185,3237548,3237551,3237535,3278560,3280420,3280409,3280258,3280186,3407028,3407521,3407181,3407532,3278525];

/**
 * Fetches the Schains stats data
 * @returns tuple with schains name and corresponding data
 */
async function SKALEFetch(restructureFunction: (data: any) => [string[], string[]]): Promise<[string[], string[]]> {
    try {
        const response = await axios.get(skale_endpoint);
        return restructureFunction(response.data.payload.schains);
      } catch (error) {
        console.error(error);
        return [[],[]];
      }
}

/**
 * Formats the schain json data to be passed in the Dune upload request body
 * @param schain_data json data fetched from skale stats endpoint
 * @returns tuple with schains name and corresponding data
 */
function RestructSKALEData(schain_data:any):[string[], string[]] {
    const namesArray: string[] = [];
    const formattedStringsArray: string[] = [];

    for(const key in schain_data) {
        namesArray.push(key);
        
        const groupByMonth = schain_data[key].group_by_month;
        var formattedStrings: string = 'month,tx_count_total,block_count_total,gas_total_used,gas_fees_total_gwei,gas_fees_total_eth,gas_fees_total_usd,users_count_total';

        for (const month in groupByMonth) {
            if (groupByMonth.hasOwnProperty(month)  && month != "1970-01") {
                const monthData = groupByMonth[month];
                var amount_users = monthData.users_count_total == undefined ? 0 : monthData.users_count_total;

                const formattedString = `${month}, ${monthData.tx_count_total}, ${monthData.block_count_total}, ${monthData.gas_total_used}, ${monthData.gas_fees_total_gwei}, ${monthData.gas_fees_total_eth}, ${monthData.gas_fees_total_usd}, ${amount_users}`;
                formattedStrings += '\n' + formattedString;
            }
        }
        formattedStringsArray.push(formattedStrings);
    }

    return [namesArray,formattedStringsArray];
}


function RestructSKALEData_30(schain_data:any):[string[], string[]] {
    const namesArray: string[] = [];
    const formattedStringsArray: string[] = [];
    var formattedStrings: string = 'schain,tx_count_total,block_count_total,gas_total_used,gas_fees_total_gwei,gas_fees_total_eth,gas_fees_total_usd,users_count_total';

    for(const key in schain_data) {
        namesArray.push(key);
        
        const total_30d = schain_data[key].total_30d;

        const formattedString = `${key},${total_30d.tx_count_total},${total_30d.block_count_total},${total_30d.gas_total_used},${total_30d.gas_fees_total_gwei},${total_30d.gas_fees_total_eth},${total_30d.gas_fees_total_usd},${total_30d.users_count_total}`;
        formattedStrings += '\n' + formattedString;
    }
    formattedStringsArray.push(formattedStrings);
    return [namesArray,formattedStringsArray];
}


/**
 * Schain data upload to Dune
 * @param start_index array index with the schain data from which the upload to Dune starts
 */
export async function DuneUpload_Months_Data(start_index: number = 0) {
    const skale_data = await SKALEFetch(RestructSKALEData);

    const headers= {'X-Dune-Api-Key': api_key};
   
    for(let i = start_index; i < skale_data[0].length; i++){
        const schain_name = skale_data[0][i];
        const schain_data = skale_data[1][i];

        const data = {
            "table_name": schain_name,
            "description": "Data of the SKALE Chain named " + schain_name,
            "is_private": false,
            "data": schain_data
        }
        try {
            const response = await axios.post(dune_endpoint,data,{headers});
            console.log(schain_name + " ; " + i);
            console.log(response.status);
          } catch (error: any) {
            if (error.response && error.response.status === 429) {
                console.log(schain_name + " ; " + i);
                console.error('Rate limit exceeded. Waiting and retrying...');
                await new Promise((resolve) => setTimeout(resolve, 5000)); 
                await DuneUpload_Months_Data(i);
              } else {
                console.error('An error occurred:', error.message);
              }        
          }
          await new Promise((resolve) => setTimeout(resolve, 5000));
    }
}


/**
 * Schain data upload to Dune
 * @param start_index array index with the schain data from which the upload to Dune starts
 */
export async function DuneUpload_30d_Data(start_index: number = 0) {
    const skale_data = await SKALEFetch(RestructSKALEData_30);
    const headers= {'X-Dune-Api-Key': api_key};
   
        const schain_data = skale_data[1][0];

        const data = {
            "table_name": "thirty_days_data",
            "description": "thirty days table",
            "is_private": false,
            "data": schain_data
        }

        try {
            const response = await axios.post(dune_endpoint,data,{headers});
            console.log(response.status);
          } catch (error: any) {
            if (error.response && error.response.status === 429) {
                console.error('Rate limit exceeded. Waiting and retrying...');
                await new Promise((resolve) => setTimeout(resolve, 5000)); 
                await DuneUpload_30d_Data(0);
              } else {
                console.error('An error occurred:', error.message);
              }        
          }
          await new Promise((resolve) => setTimeout(resolve, 5000));
}
/**
 * Function to run queries on Dune and update data
 */
export async function Update_Dune_Queries(start_index: number = 0){
    const headers= {'X-Dune-Api-Key': api_key};

    var query_id = "";
    var base_url = "https://api.dune.com/api/v1/query/";

    for(let i = start_index; i < queries_ids_to_update.length; i++){

        query_id = "" + queries_ids_to_update[i];
        const target_endpoint = base_url + query_id + "/execute";
        try {
            const response = await axios.post(target_endpoint,{},{headers});
            console.log(target_endpoint);
            console.log(response.status);
          } catch (error: any) {
            if (error.response && error.response.status === 429) {
                console.log(base_url);
                console.error('Rate limit exceeded. Waiting and retrying...');
                await new Promise((resolve) => setTimeout(resolve, 5000)); 
                await DuneUpload_Months_Data(i);
              } else {
                console.log(target_endpoint);
                console.error('An error occurred:', error.message);
              }        
          }
          await new Promise((resolve) => setTimeout(resolve, 5000));
          
    }

}

export async function Upload_Schain_Names (){
  const headers= {'X-Dune-Api-Key': api_key};
   
  const data = {
      "table_name": "skale_chains_names",
      "description": "skale chains names",
      "is_private": false,
      "data": "schain,short_name\ngreen-giddy-denebola,Nebula\nhonorable-steel-rasalhague,Calypso\nadorable-quaint-bellatrix,StreamMyScreen\naffectionate-immediate-pollux,CryptoBlades\ncurly-red-alterf,Fireside\nelated-tan-skat,Europa\nfit-betelgeuse,Curio DAO\nfrayed-decent-antares,Block Brawlers\nfussy-smoggy-megrez,StrayShot\ngargantuan-wealthy-zosma,Gargantuan Wealthy Zosma\nharsh-alsuhail,Harsh Alsuhail\nhaunting-devoted-deneb,Crypto Colosseum\nlight-vast-diphda,Exorde\nparallel-stormy-spica,Titan\nplain-rotanev,Ivy Cash\nportly-passionate-sirius,Solydaria\nround-hasty-alsafi,DEXGAME\nturbulent-unique-scheat,Razor Network\nwan-red-ain,Human Protocol\nwary-teeming-mizar,Wary Teeming Mizar"
  }

  try {
      const response = await axios.post(dune_endpoint,data,{headers});
      console.log(response.status);
    } catch (error: any) {
      if (error.response && error.response.status === 429) {
          console.error('Rate limit exceeded. Waiting and retrying...');
          await new Promise((resolve) => setTimeout(resolve, 5000)); 
          await Upload_Schain_Names();
        } else {
          console.error('An error occurred:', error.message);
        }        
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
}

export async function Upload_Schain_Price (){
  const headers= {'X-Dune-Api-Key': api_key};
   
  const data = {
      "table_name": "skale_chains_price",
      "description": "skale chains price",
      "is_private": false,
      "data": "schain_type,base_monthly_price,number_tiers\nApp Chain,3600,1\nHub Chain,100,3"
  }

  try {
      const response = await axios.post(dune_endpoint,data,{headers});
      console.log(response.status);
    } catch (error: any) {
      if (error.response && error.response.status === 429) {
          console.error('Rate limit exceeded. Waiting and retrying...');
          await new Promise((resolve) => setTimeout(resolve, 5000)); 
          await Upload_Schain_Price();
        } else {
          console.error('An error occurred:', error.message);
        }        
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
}

async function Calls (){
  await DuneUpload_Months_Data();
  await DuneUpload_30d_Data();
  await Update_Dune_Queries();
  //Upload_Schain_Names();
 // Upload_Schain_Price();
}
