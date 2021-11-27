const p2p = require('p2p');

const peer = p2p.peer({
  host: 'localhost',
  port: 4059,
  /*metadata: {
    nodeType: 'COMBINE',
    nodeID: 'THX'
  },*/
  wellKnownPeers: [
    { host: 'localhost', port: 4059 },
    { host: '95.216.35.232', port: 4058 }
  ]
});

peer.on('status::*', status => {
  console.info('Changed status.', status);
});

peer.on('environment::successor', successor => {
  console.info('Changed successor.', { successor });
});

peer.on('environment::predecessor', predecessor => {
  console.info('Changed predecessor.', { predecessor });
});

peer.handle.process = function (payload, done) {
  console.info('Processing job.', payload);
  done(null, {
    endpoint: peer.self
  });
};

console.log(peer.status());
