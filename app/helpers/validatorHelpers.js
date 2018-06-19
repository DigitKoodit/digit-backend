const { validationResult } = require('express-validator/check')
const { matchedData } = require('express-validator/filter')
const { pick, keys } = require('lodash')
const createError = require('http-errors')

const checkValidationResult = (req, res, next) => {
  req._validationErrors = req._validationErrors.filter(error => {
    const context = req._validationContexts.find(context => {
      return context.locations.includes(error.location) &&
        context.fields.length === 1 &&
        context.fields.includes(error.param) &&
        context.optional &&
        context.optional.canBeNull // custom flag to indicate null is ok
    })
    if(context) {
      return error.value !== null
    }
    return true
  })
  const result = validationResult(req)
  if(result.isEmpty()) {
    return next()
  } else {
    return next(createError(400, 'Validation error', { data: result.array() }))
  }
}

const getFieldFilter = (clearErrors, target = 'body') => (req, res, next) => {
  if(clearErrors) {
    req._validationErrorsOneOf = []
  } else {
    req[target] = pick(req.body, keys(matchedData(req, { locations: ['body'] })))
  }
  next()
}

const getValidator = (validatorChain, clearErrors) => {
  return [
    ...validatorChain,
    checkValidationResult,
    getFieldFilter(clearErrors)
  ]
}

const isolateContext = (req, res, next) => {
  req._backupValidationContexts = req._validationContexts
  delete req._validationContexts
  next()
}
const restoreContext = (req, res, next) => {
  req._validationContexts = [...req._backupValidationContexts, ...req._validationContexts]
  next()
}

const getStringValidator = (name, min = 1) => {
  return ({
    in: ['body'],
    isString: {
      errorMessage: `${name} pitää olla tekstimuodossa`
    },
    trim: true,
    isLength: {
      errorMessage: `${name} puuttuu`,
      options: { min }
    }
  })
}

const getLowerCaseStringValidator = (name, min = 1) => {
  return ({
    ...getStringValidator(name, min),
    customSanitizer: {
      options: (value) => {
        return value.toLowerCase()
      }
    }
  })
}

const getIntValidator = name => ({
  in: ['body'],
  isInt: true,
  toInt: true,
  errorMessage: `${name} puuttuu`
})

const getDecimalValidator = name => ({
  in: ['body'],
  isDecimal: true,
  toFloat: true,
  errorMessage: `${name} puuttuu`
})

const getStringArrayValidator = name => ({
  in: ['body'],
  isArray: true,
  errorMessage: `${name} puuttuu`,
  custom: {
    options: array => array.every(item => item && item.length > 0)
  }
})

const getBooleanValidator = name => ({
  in: ['body'],
  isBoolean: true,
  errorMessage: `${name} puuttuu`
})

const getEmailValidator = name => ({
  in: ['body'],
  isEmail: {
    errorMessage: `${name} ei ole oikeassa muodossa`
  },
  errorMessage: `${name} puuttuu`
})

const setIsOptional = validator => ({
  ...validator,
  optional: {
    options: {
      canBeNull: true
    }
  }
})

module.exports = {
  getValidator,
  getFieldFilter,
  isolateContext,
  restoreContext,
  getStringValidator,
  getIntValidator,
  getDecimalValidator,
  getBooleanValidator,
  getStringArrayValidator,
  getLowerCaseStringValidator,
  getEmailValidator,
  setIsOptional
}
