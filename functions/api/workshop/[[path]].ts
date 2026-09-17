import { handleWorkshopRequest, type WorkshopEnv } from '../workshop/handler'

type PagesContext = {
  request: Request
  env: WorkshopEnv
  params: { path?: string[] }
}

export async function onRequest(context: PagesContext): Promise<Response> {
  return handleWorkshopRequest(context.request, context.env)
}
