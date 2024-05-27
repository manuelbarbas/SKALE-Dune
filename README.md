## SKALE on Dune

Please run the following command to install the needed packages:
```sh
npm install
```

To update some of the Dune tables run one of the following commands:

To update the SKALE Chain stats tables: UAWs, Txs, Gas Spent, etc...
```sh
node --loader ts-node/esm DuneController.ts stats
```

To update the table with the SKALE chain names
```sh
node --loader ts-node/esm DuneController.ts names
```

To update the table with the SKALE chain prices
```sh
node --loader ts-node/esm DuneController.ts prices
```
