import { WorkOS } from '@workos-inc/node'

let _workos: WorkOS | null = null

export function getWorkOS(): WorkOS {
  if (!_workos) {
    _workos = new WorkOS(process.env.WORKOS_API_KEY!)
  }
  return _workos
}

export function getClientId(): string {
  return process.env.WORKOS_CLIENT_ID!
}
