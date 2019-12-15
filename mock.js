// mock api
const express = require('express')
const app = express()

app.get('/api/course/list', (req, res) => {
  // 跨域
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
  res.header('Content-Type', 'application/json;charset=utf-8')
  res.json({
    code: 0,
    list: [{
        name: 'web full stack',
        id: 1
      },
      {
        name: 'web front end',
        id: 2
      },
      {
        name: 'web back end',
        id: 3
      },
      {
        name: 'web java',
        id: 4
      },
    ]
  })
})
app.get('/api/user/info', (req, res) => {
  // 跨域
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
  res.header('Content-Type', 'application/json;charset=utf-8')
  res.json({
    code: 0,
    data: {
      name: 'kkb',
      id: 4,
      best: 'dasheng'
    }
  })
  // res.error({
  //   msg: '1'
  // })
})

app.listen(9091, () => {
  console.log('mock up')
})