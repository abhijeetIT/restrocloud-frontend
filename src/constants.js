export const CATEGORIES = [
  'STARTER','MAIN_COURSE','DRINKS','DESSERT','SNACK','BREAKFAST','LUNCH','DINNER'
]
export const CATEGORY_EMOJI = {
  STARTER:'🥗', MAIN_COURSE:'🍛', DRINKS:'🥤', DESSERT:'🍰',
  SNACK:'🍟', BREAKFAST:'🍳', LUNCH:'🥘', DINNER:'🍽'
}

export const TABLE_STATUSES  = ['AVAILABLE','OCCUPIED','RESERVED']

// ✅ Correct from your Spring Boot entity
export const ORDER_STATUSES  = ['PLACED','PREPARING','SERVED','COMPLETED','CANCELLED']
export const PAYMENT_METHODS  = ['CASH','UPI','CARD']
export const PAYMENT_STATUSES = ['PAID','PENDING','FAILED']

export const ORDER_STATUS_COLOR = {
  PLACED:     { bg:'rgba(69,123,157,.15)',  color:'#457b9d' },
  PREPARING:  { bg:'rgba(244,162,97,.18)',  color:'#c0622a' },
  SERVED:     { bg:'rgba(249,199,79,.18)',  color:'#a07800' },
  COMPLETED:  { bg:'rgba(45,198,83,.15)',   color:'#1a8c3b' },
  CANCELLED:  { bg:'rgba(230,57,70,.12)',   color:'#e63946' },
}
export const PAYMENT_STATUS_COLOR = {
  PAID:     { bg:'rgba(45,198,83,.15)',   color:'#1a8c3b' },
  PENDING:  { bg:'rgba(249,199,79,.18)',  color:'#a07800' },
  FAILED:   { bg:'rgba(230,57,70,.12)',   color:'#e63946' },
}
export const TABLE_STATUS_COLOR = {
  AVAILABLE: { border:'rgba(45,198,83,.5)',  color:'#1a8c3b' },
  OCCUPIED:  { border:'rgba(230,57,70,.5)',  color:'#e63946' },
  RESERVED:  { border:'rgba(244,162,97,.6)', color:'#c0622a' },
}
