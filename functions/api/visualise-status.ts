import {
  corsPreflight,
  getChatModel,
  getCreateModel,
  getFalKey,
  getRefineModel,
  isPublicAiOpen,
  json,
  PUBLIC_AI_UNTIL_LABEL,
  type Env,
} from '../_shared/fal'

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const falKey = getFalKey(context.env)
  const publicOpen = isPublicAiOpen()
  const configured = Boolean(falKey)

  return json({
    configured: configured && (publicOpen || configured),
    publicOpen: publicOpen && configured,
    publicOpenUntil: PUBLIC_AI_UNTIL_LABEL,
    mode: configured ? (publicOpen ? 'public-ai' : 'paid-ai') : 'needs-key',
    model: getCreateModel(context.env),
    refineModel: getRefineModel(context.env),
    chatModel: getChatModel(context.env),
    message:
      publicOpen && configured
        ? `Complimentary AI is open for all visitors until ${PUBLIC_AI_UNTIL_LABEL}.`
        : publicOpen && !configured
          ? 'Public AI window is active, but FAL_KEY is not set on the server yet.'
          : undefined,
  })
}

export const onRequestOptions: PagesFunction = async () => corsPreflight()
