'use strict'

const archiver = require('archiver')
const sanitizeFilename = require('sanitize-filename')
const async = require('async')
const Router = require('express').Router

const errors = require('../errors')
const config = require('../config')
const models = require('../models')
const logger = require('../logger')
const { generateAvatar } = require('../letter-avatars')

const UserRouter = module.exports = Router()

// get me info
UserRouter.get('/me', function (req, res) {
  if (req.isAuthenticated()) {
    models.User.findOne({
      where: {
        id: req.user.id
      }
    }).then(function (user) {
      if (!user) { return errors.errorNotFound(res) }
      const profile = models.User.getProfile(user)
      res.send({
        status: 'ok',
        id: req.user.id,
        name: profile.name,
        photo: profile.photo
      })
    }).catch(function (err) {
      logger.error('read me failed: ' + err)
      return errors.errorInternalError(res)
    })
  } else {
    res.send({
      status: 'forbidden'
    })
  }
})

// delete the currently authenticated user
UserRouter.get('/me/delete/:token?', function (req, res) {
  if (req.isAuthenticated()) {
    models.User.findOne({
      where: {
        id: req.user.id
      }
    }).then(function (user) {
      if (!user) {
        return errors.errorNotFound(res)
      }
      if (user.deleteToken === req.params.token) {
        user.destroy().then(function () {
          res.redirect(config.serverURL + '/')
        })
      } else {
        return errors.errorForbidden(res)
      }
    }).catch(function (err) {
      logger.error('delete user failed: ' + err)
      return errors.errorInternalError(res)
    })
  } else {
    return errors.errorForbidden(res)
  }
})

UserRouter.get('/user/:username/avatar.svg', function (req, res, next) {
  res.setHeader('Content-Type', 'image/svg+xml')
  res.setHeader('Cache-Control', 'public, max-age=86400')
  res.send(generateAvatar(req.params.username))
})
