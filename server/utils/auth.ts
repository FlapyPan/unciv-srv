import type { H3Event } from 'h3'
import bcrypt from 'bcrypt'
import prisma from '~/lib/prisma'

const SALT_ROUNDS = 8

export const authError = () => createError({ statusCode: 401, statusMessage: 'Unauthorized' })

export const hashPassword = async (password: string) => bcrypt.hash(password, SALT_ROUNDS)

export const extractPassword = async (event: H3Event) => {
  const authHeader = event.headers.get('authorization')
  if (!authHeader) throw authError()
  const { 0: type, 1: token } = authHeader.split(' ')
  if (type !== 'Basic') throw authError()
  const authorization = Buffer.from(token, 'base64').toString('utf8')
  const { 0: playerId, 1: password } = authorization.split(':')
  if (!playerId || !password) throw authError()
  return { playerId, password }
}

export enum AuthStatus {
  Valid = 0,
  Invalid = 1,
  Missing = 2,
}

export const checkAuth = async (
  playerId: string | undefined | null,
  password: string | undefined | null,
): Promise<AuthStatus> => {
  if (!playerId || !password) return AuthStatus.Invalid
  const player = await prisma.player.findUnique({ where: { id: playerId } })
  if (!player) return AuthStatus.Missing
  const valid = await bcrypt.compare(password, player.password)
  if (!valid) return AuthStatus.Invalid
  return AuthStatus.Valid
}
