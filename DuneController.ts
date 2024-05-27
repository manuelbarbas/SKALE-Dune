
import {DuneUpload_Months_Data , DuneUpload_30d_Data , Update_Dune_Queries , Upload_Schain_Names , Upload_Schain_Price} from "./Requests";


async function UpdateSchainStats() {
    await DuneUpload_Months_Data();
    await DuneUpload_30d_Data();
    await Update_Dune_Queries();
}

async function UpdateSchainNamesTable() {
    await Upload_Schain_Names();
}

async function UpdateSchainPriceTable() {
    await Upload_Schain_Price();
}


function Call (){
    const params = process.argv.slice(2)

    switch(params[0]){
        case "stats":
            UpdateSchainStats();
            break;
        case "names":
            UpdateSchainNamesTable();
            break;
        case "prices":
            UpdateSchainPriceTable();
            break;
        default:
            console.log("Wrong command. Run one of the following ones: ");
            console.log("node --loader ts-node/esm DuneController.ts stats")
            console.log("node --loader ts-node/esm DuneController.ts names")
            console.log("node --loader ts-node/esm DuneController.ts prices")
    }
}

Call();