import {
  corsPreflight,
  getCreateModel,
  getFalKey,
  getRefineModel,
  isPublicAiOpen,
  json,
  PUBLIC_AI_UNTIL_LABEL,
  type Env,
} from '../_shared/fal'

/** During the public AI window, visitors cannot override the server key. */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  if (isPublicAiOpen() && getFalKey(context.env)) {
    return json({
      configured: true,
      publicOpen: true,
      publicOpenUntil: PUBLIC_AI_UNTIL_LABEL,
      mode: 'public-ai',
      model: getCreateModel(context.env),
      refineModel: getRefineModel(context.env),
      message: `Complimentary AI is already open until ${PUBLIC_AI_UNTIL_LABEL} — no personal key needed.`,
    })
  }

  return json(
    {
      error:
        'Visitor key paste is disabled on the live site. Add FAL_KEY in Cloudflare Pages settings, or use local `npm run dev` with a .env key.',
      code: 'CONFIG_DISABLED',
    },
    403,
  )
}

export const onRequestOptions: PagesFunction = async () => corsPreflight()
