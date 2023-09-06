import React, { useState } from 'react'
import Master from '../components/Master'
import Env from '../config/env.config'
import { strings as commonStrings } from '../lang/common'
import { strings as ccStrings } from '../lang/create-company'
import { strings } from '../lang/create-user'
import * as Helper from '../common/Helper'
import * as UserService from '../services/UserService'
import * as SupplierService from '../services/SupplierService'
import Error from '../components/Error'
import Backdrop from '../components/SimpleBackdrop'
import Avatar from '../components/Avatar'
import DatePicker from '../components/DatePicker'
import { Input, InputLabel, FormControl, FormHelperText, Button, Paper, Select, MenuItem, FormControlLabel, Switch, SelectChangeEvent } from '@mui/material'
import { Info as InfoIcon } from '@mui/icons-material'
import validator from 'validator'
import { intervalToDuration } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import * as bookcarsTypes from 'bookcars-types'

import '../assets/css/create-user.css'

const CreateUser = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState<bookcarsTypes.User>()
  const [admin, setAdmin] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [bio, setBio] = useState('')
  const [error, setError] = useState(false)
  const [emailError, setEmailError] = useState(false)
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fullNameError, setFullNameError] = useState(false)
  const [avatar, setAvatar] = useState('')
  const [avatarError, setAvatarError] = useState(false)
  const [type, setType] = useState('')
  const [emailValid, setEmailValid] = useState(true)
  const [phoneValid, setPhoneValid] = useState(true)
  const [payLater, setPayLater] = useState(true)
  const [birthDate, setBirthDate] = useState<Date>()
  const [birthDateValid, setBirthDateValid] = useState(true)

  const handleUserTypeChange = async (e: SelectChangeEvent<string>) => {
    const type = e.target.value

    setType(type)

    if (type === bookcarsTypes.RecordType.Company) {
      await validateFullName(fullName)
    } else {
      setFullNameError(false)
    }
  }

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFullName(e.target.value)

    if (!e.target.value) {
      setFullNameError(false)
    }
  }

  const validateFullName = async (fullName: string) => {
    if (fullName) {
      try {
        const status = await SupplierService.validate({ fullName })

        if (status === 200) {
          setFullNameError(false)
          setError(false)
          return true
        } else {
          setFullNameError(true)
          setAvatarError(false)
          setError(false)
          return false
        }
      } catch (err) {
        Helper.error(err)
      }
    } else {
      setFullNameError(false)
      return true
    }
  }

  const handleFullNameBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    if (type === bookcarsTypes.RecordType.Company) {
      await validateFullName(e.target.value)
    } else {
      setFullNameError(false)
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)

    if (!e.target.value) {
      setEmailError(false)
      setEmailValid(true)
    }
  }

  const validateEmail = async (email?: string) => {
    if (email) {
      if (validator.isEmail(email)) {
        try {
          const status = await UserService.validateEmail({ email })
          if (status === 200) {
            setEmailError(false)
            setEmailValid(true)
            return true
          } else {
            setEmailError(true)
            setEmailValid(true)
            setAvatarError(false)
            setError(false)
            return false
          }
        } catch (err) {
          Helper.error(err)
        }
      } else {
        setEmailError(false)
        setEmailValid(false)
        return false
      }
    } else {
      setEmailError(false)
      setEmailValid(true)
      return false
    }
  }

  const handleEmailBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    await validateEmail(e.target.value)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value)

    if (!e.target.value) {
      setPhoneValid(true)
    }
  }

  const validatePhone = (phone?: string) => {
    if (phone) {
      const phoneValid = validator.isMobilePhone(phone)
      setPhoneValid(phoneValid)

      return phoneValid
    } else {
      setPhoneValid(true)

      return true
    }
  }

  const handlePhoneBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    validatePhone(e.target.value)
  }

  const validateBirthDate = (date?: Date) => {
    if (date && Helper.isDate(date) && type === bookcarsTypes.RecordType.User) {
      const now = new Date()
      const sub = intervalToDuration({ start: date, end: now }).years ?? 0
      const birthDateValid = sub >= Env.MINIMUM_AGE

      setBirthDateValid(birthDateValid)
      return birthDateValid
    } else {
      setBirthDateValid(true)
      return true
    }
  }

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocation(e.target.value)
  }

  const handleBioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBio(e.target.value)
  }

  const onBeforeUpload = () => {
    setLoading(true)
  }

  const onAvatarChange = (avatar: string) => {
    setLoading(false)
    setAvatar(avatar)

    if (avatar !== null && type === bookcarsTypes.RecordType.Company) {
      setAvatarError(false)
    }
  }

  const handleCancel = async () => {
    try {
      if (avatar) {
        await UserService.deleteTempAvatar(avatar)
        navigate('/users')
      } else {
        navigate('/users')
      }
    } catch {
      navigate('/users')
    }
  }

  const onLoad = (user?: bookcarsTypes.User) => {
    if (user && user.verified) {
      const admin = Helper.admin(user)
      setUser(user)
      setAdmin(admin)
      setType(admin ? '' : bookcarsTypes.RecordType.User)
      setVisible(true)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault()

      if (!user) {
        Helper.error()
        return
      }

      if (type === bookcarsTypes.RecordType.Company) {
        const fullNameValid = await validateFullName(fullName)

        if (!fullNameValid) {
          return
        }
      } else {
        setFullNameError(false)
      }

      const emailValid = await validateEmail(email)
      if (!emailValid) {
        return
      }

      const phoneValid = validatePhone(phone)
      if (!phoneValid) {
        return
      }

      const birthDateValid = validateBirthDate(birthDate)
      if (!birthDateValid) {
        return
      }

      if (type === bookcarsTypes.RecordType.Company && !avatar) {
        setAvatarError(true)
        setError(false)
        return
      }

      const language = UserService.getLanguage()
      const company = admin ? undefined : user._id

      const data: bookcarsTypes.CreateUserPayload = {
        email,
        phone,
        location,
        bio,
        fullName,
        type,
        avatar,
        birthDate,
        language,
        company,
      }

      if (type === bookcarsTypes.RecordType.Company) {
        data.payLater = payLater
      }

      const status = await UserService.create(data)

      if (status === 200) {
        navigate('/users')
      } else {
        setError(true)
      }
    } catch (err) {
      Helper.error(err)
    }
  }

  const company = type === bookcarsTypes.RecordType.Company
  const driver = type === bookcarsTypes.RecordType.User

  return (
    <Master onLoad={onLoad} strict>
      {user && (
        <div className="create-user">
          <Paper className="user-form user-form-wrapper" elevation={10} style={visible ? {} : { display: 'none' }}>
            <h1 className="user-form-title"> {strings.CREATE_USER_HEADING} </h1>
            <form onSubmit={handleSubmit}>
              <Avatar
                type={type}
                mode="create"
                record={null}
                size="large"
                readonly={false}
                onBeforeUpload={onBeforeUpload}
                onChange={onAvatarChange}
                color="disabled"
                className="avatar-ctn"
              />

              {company && (
                <div className="info">
                  <InfoIcon />
                  <label>{ccStrings.RECOMMENDED_IMAGE_SIZE}</label>
                </div>
              )}

              {admin && (
                <FormControl fullWidth margin="dense" style={{ marginTop: company ? 0 : 39 }}>
                  <InputLabel className="required">{commonStrings.TYPE}</InputLabel>
                  <Select label={commonStrings.TYPE} value={type} onChange={handleUserTypeChange} variant="standard" required fullWidth>
                    <MenuItem value={bookcarsTypes.RecordType.Admin}>{Helper.getUserType(bookcarsTypes.RecordType.Admin)}</MenuItem>
                    <MenuItem value={bookcarsTypes.RecordType.Company}>{Helper.getUserType(bookcarsTypes.RecordType.Company)}</MenuItem>
                    <MenuItem value={bookcarsTypes.RecordType.User}>{Helper.getUserType(bookcarsTypes.RecordType.User)}</MenuItem>
                  </Select>
                </FormControl>
              )}

              <FormControl fullWidth margin="dense">
                <InputLabel className="required">{commonStrings.FULL_NAME}</InputLabel>
                <Input id="full-name" type="text" error={fullNameError} required onBlur={handleFullNameBlur} onChange={handleFullNameChange} autoComplete="off" />
                <FormHelperText error={fullNameError}>{(fullNameError && ccStrings.INVALID_COMPANY_NAME) || ''}</FormHelperText>
              </FormControl>

              <FormControl fullWidth margin="dense">
                <InputLabel className="required">{commonStrings.EMAIL}</InputLabel>
                <Input id="email" type="text" error={!emailValid || emailError} onBlur={handleEmailBlur} onChange={handleEmailChange} autoComplete="off" required />
                <FormHelperText error={!emailValid || emailError}>
                  {(!emailValid && commonStrings.EMAIL_NOT_VALID) || ''}
                  {(emailError && commonStrings.EMAIL_ALREADY_REGISTERED) || ''}
                </FormHelperText>
              </FormControl>

              {driver && (
                <FormControl fullWidth margin="dense">
                  <DatePicker
                    label={strings.BIRTH_DATE}
                    value={birthDate}
                    required
                    onChange={(birthDate: Date) => {
                      const birthDateValid = validateBirthDate(birthDate)

                      setBirthDate(birthDate)
                      setBirthDateValid(birthDateValid)
                    }}
                    language={(user && user.language) || Env.DEFAULT_LANGUAGE}
                  />
                  <FormHelperText error={!birthDateValid}>{(!birthDateValid && commonStrings.BIRTH_DATE_NOT_VALID) || ''}</FormHelperText>
                </FormControl>
              )}

              <FormControl fullWidth margin="dense">
                <InputLabel className={driver ? 'required' : ''}>{commonStrings.PHONE}</InputLabel>
                <Input id="phone" type="text" onBlur={handlePhoneBlur} onChange={handlePhoneChange} error={!phoneValid} required={driver ? true : false} autoComplete="off" />
                <FormHelperText error={!phoneValid}>{(!phoneValid && commonStrings.PHONE_NOT_VALID) || ''}</FormHelperText>
              </FormControl>

              <FormControl fullWidth margin="dense">
                <InputLabel>{commonStrings.LOCATION}</InputLabel>
                <Input id="location" type="text" onChange={handleLocationChange} autoComplete="off" />
              </FormControl>

              <FormControl fullWidth margin="dense">
                <InputLabel>{commonStrings.BIO}</InputLabel>
                <Input id="bio" type="text" onChange={handleBioChange} autoComplete="off" />
              </FormControl>

              {company && (
                <FormControl component="fieldset" style={{ marginTop: 15 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={payLater}
                        onChange={(e) => {
                          setPayLater(e.target.checked)
                        }}
                        color="primary"
                      />
                    }
                    label={commonStrings.PAY_LATER}
                  />
                </FormControl>
              )}

              <div className="buttons">
                <Button type="submit" variant="contained" className="btn-primary btn-margin-bottom" size="small">
                  {commonStrings.CREATE}
                </Button>
                <Button variant="contained" className="btn-secondary btn-margin-bottom" size="small" onClick={handleCancel}>
                  {commonStrings.CANCEL}
                </Button>
              </div>

              <div className="form-error">
                {error && <Error message={commonStrings.GENERIC_ERROR} />}
                {avatarError && <Error message={commonStrings.IMAGE_REQUIRED} />}
              </div>
            </form>
          </Paper>
        </div>
      )}
      {loading && <Backdrop text={commonStrings.PLEASE_WAIT} />}
    </Master>
  )
}

export default CreateUser
