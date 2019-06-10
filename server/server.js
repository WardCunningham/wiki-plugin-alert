// alert plugin, server-side component
// These handlers are launched with the wiki server.

const events = require('events')

const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

function startServer (params) {

  let app = params.app
  let argv = params.argv

  let detectors = {} // slug/item => annotated schedule
  let emitters = emittersFor(app) // "slug/item" => emitter

  function emittersFor (app) {
    if (!app.serviceEmitters) {
      app.serviceEmitters = {}
    }
    return app.serviceEmitters
  }

  function emitterFor (slugitem) {
    if (!emitters[slugitem]) {
      emitters[slugitem] = new events.EventEmitter()
    }
    return emitters[slugitem]
  }

  // {
  //   sources: [
  //     {slugitem: "slug/item", service: {...}, listener: function},
  //     {slugitem: "slug/item", service: {...}}
  //   ]
  // }

  function activate(slugitem, schedule) {
    for (let source of schedule.sources||[]) {
      source.listener = (data) => notify(source, data)
      let emitter = emitterFor(source.slugitem)
      emitter.on('notice',source.listener)
    }
    return schedule

    async function notify(source, data) {
      let Message = `${data.signal} trouble: ${data.notice}`
      let params = {Message, TopicArn: 'arn:aws:sns:us-east-1:581084879107:ping-wiki-servers'}
      let result = await new AWS.SNS({apiVersion: '2010-03-31'}).publish(params).promise();
    }
  }

  function deactivate(schedule) {
    for (let source of schedule.sources||[]) {
      emitterFor(source.slugitem).removeListener('notice', source.listener)
    }
  }

  function start(slugitem, schedule) {
    console.log({slugitem, schedule})
    detectors[slugitem] = activate(slugitem, schedule)
  }

  function stop(slugitem) {
    console.log({slugitem})
    deactivate(detectors[slugitem]||{sources:[]})
    delete detectors[slugitem]
  }

  function owner(req, res, next) {
    if(app.securityhandler.isAuthorized(req)) {
      next()
    } else {
      res.status(403).send({
        error: 'operation reserved for site owner'
      })
    }
  }


  // {
  //   action: "start",
  //   schedule: {...}
  // }

  app.post('/plugin/alert/:slug/id/:id/', owner, (req, res) => {
    let slug = req.params['slug']
    let item = req.params['id']
    let slugitem = `${slug}/${item}`
    let command = req.body
    if (command.action) {
      if (command.action == 'start') {
        start(slugitem, command.schedule)
      } else if (command.action == 'stop') {
        stop(slugitem)
      }
    }
    let status = detectors[slugitem] ? 'active' : 'inactive'
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({status}));
  })

}

module.exports = {startServer};

