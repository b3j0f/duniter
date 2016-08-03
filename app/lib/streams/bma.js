"use strict";

const co = require('co');
const es = require('event-stream');
const network = require('../system/network');
const dtos = require('./dtos');
const sanitize = require('./sanitize');
const limiter = require('../system/limiter');

let WebSocketServer = require('ws').Server;

module.exports = function(server, interfaces, httpLogs) {

  if (!interfaces) {
    interfaces = [];
    if (server.conf) {
      interfaces = [{
        ip: server.conf.ipv4,
        port: server.conf.port
      }];
      if (server.conf.ipv6) {
        interfaces.push({
          ip: server.conf.ipv6,
          port: server.conf.port
        });
      }
    }
  }

  return network.createServersAndListen('Duniter server', interfaces, httpLogs, null, (app, httpMethods) => {

    const node         = require('../../controllers/node')(server);
    const blockchain   = require('../../controllers/blockchain')(server);
    const net          = require('../../controllers/network')(server, server.conf);
    const wot          = require('../../controllers/wot')(server);
    const transactions = require('../../controllers/transactions')(server);
    const dividend     = require('../../controllers/uds')(server);
    httpMethods.httpGET(  '/node/summary',                          node.summary,                         dtos.Summary,        limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpGET(  '/blockchain/parameters',                 blockchain.parameters,                dtos.Parameters,     limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpPOST( '/blockchain/membership',                 blockchain.parseMembership,           dtos.Membership,     limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpGET(  '/blockchain/memberships/:search',        blockchain.memberships,               dtos.Memberships,    limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpPOST( '/blockchain/block',                      blockchain.parseBlock,                dtos.Block,          limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpGET(  '/blockchain/block/:number',              blockchain.promoted,                  dtos.Block,          limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpGET(  '/blockchain/blocks/:count/:from',        blockchain.blocks,                    dtos.Blocks,         limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpGET(  '/blockchain/current',                    blockchain.current,                   dtos.Block,          limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpGET(  '/blockchain/hardship/:search',           blockchain.hardship,                  dtos.Hardship,       limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpGET(  '/blockchain/difficulties',               blockchain.difficulties,              dtos.Difficulties,   limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpGET(  '/blockchain/with/newcomers',             blockchain.with.newcomers,            dtos.Stat,           limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpGET(  '/blockchain/with/certs',                 blockchain.with.certs,                dtos.Stat,           limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpGET(  '/blockchain/with/joiners',               blockchain.with.joiners,              dtos.Stat,           limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpGET(  '/blockchain/with/actives',               blockchain.with.actives,              dtos.Stat,           limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpGET(  '/blockchain/with/leavers',               blockchain.with.leavers,              dtos.Stat,           limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpGET(  '/blockchain/with/excluded',              blockchain.with.excluded,             dtos.Stat,           limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpGET(  '/blockchain/with/revoked',               blockchain.with.revoked,              dtos.Stat,           limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpGET(  '/blockchain/with/ud',                    blockchain.with.ud,                   dtos.Stat,           limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpGET(  '/blockchain/with/tx',                    blockchain.with.tx,                   dtos.Stat,           limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpGET(  '/blockchain/branches',                   blockchain.branches,                  dtos.Branches,       limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpGET(  '/network/peering',                       net.peer,                             dtos.Peer,           limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpGET(  '/network/peering/peers',                 net.peersGet,                         dtos.MerkleOfPeers,  limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpPOST( '/network/peering/peers',                 net.peersPost,                        dtos.Peer,           limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpGET(  '/network/peers',                         net.peers,                            dtos.Peers,          limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpPOST( '/wot/add',                               wot.add,                              dtos.Identity,       limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpPOST( '/wot/certify',                           wot.certify,                          dtos.Cert,           limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpPOST( '/wot/revoke',                            wot.revoke,                           dtos.Result,         limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpGET(  '/wot/lookup/:search',                    wot.lookup,                           dtos.Lookup,         limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpGET(  '/wot/members',                           wot.members,                          dtos.Members,        limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpGET(  '/wot/requirements/:search',              wot.requirements,                     dtos.Requirements,   limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpGET(  '/wot/certifiers-of/:search',             wot.certifiersOf,                     dtos.Certifications, limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpGET(  '/wot/certified-by/:search',              wot.certifiedBy,                      dtos.Certifications, limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpGET(  '/wot/identity-of/:search',               wot.identityOf,                       dtos.SimpleIdentity, limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpPOST( '/tx/process',                            transactions.parseTransaction,        dtos.Transaction,    limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpGET(  '/tx/sources/:pubkey',                    transactions.getSources,              dtos.Sources,        limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpGET(  '/tx/history/:pubkey',                    transactions.getHistory,              dtos.TxHistory,      limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpGET(  '/tx/history/:pubkey/blocks/:from/:to',   transactions.getHistoryBetweenBlocks, dtos.TxHistory,      limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpGET(  '/tx/history/:pubkey/times/:from/:to',    transactions.getHistoryBetweenTimes,  dtos.TxHistory,      limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpGET(  '/tx/history/:pubkey/pending',            transactions.getPendingForPubkey,     dtos.TxHistory,      limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpGET(  '/tx/pending',                            transactions.getPending,              dtos.TxPending,      limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpGET(  '/ud/history/:pubkey',                    dividend.getHistory,                  dtos.UDHistory,      limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpGET(  '/ud/history/:pubkey/blocks/:from/:to',   dividend.getHistoryBetweenBlocks,     dtos.UDHistory,      limiter.limit(limiter.strategy.HIGH_USAGE));
    httpMethods.httpGET(  '/ud/history/:pubkey/times/:from/:to',    dividend.getHistoryBetweenTimes,      dtos.UDHistory,      limiter.limit(limiter.strategy.HIGH_USAGE));

  }, (httpServer) => {

    let currentBlock = {};
    let wssBlock = new WebSocketServer({
      server: httpServer,
      path: '/ws/block'
    });
    let wssPeer = new WebSocketServer({
      server: httpServer,
      path: '/ws/peer'
    });

    wssBlock.on('connection', function connection(ws) {
      co(function *() {
        currentBlock = yield server.dal.getCurrentBlockOrNull();
        if (currentBlock) {
          ws.send(JSON.stringify(sanitize(currentBlock, dtos.Block)));
        }
      });
    });

    wssBlock.broadcast = (data) => wssBlock.clients.forEach((client) => client.send(data));
    wssPeer.broadcast = (data) => wssPeer.clients.forEach((client) => client.send(data));

    // Forward blocks & peers
    server
      .pipe(es.mapSync(function(data) {
        // Broadcast block
        if (data.joiners) {
          currentBlock = data;
          wssBlock.broadcast(JSON.stringify(sanitize(currentBlock, dtos.Block)));
        }
        // Broadcast peer
        if (data.endpoints) {
          wssPeer.broadcast(JSON.stringify(sanitize(data, dtos.Peer)));
        }
      }));
  });
};
