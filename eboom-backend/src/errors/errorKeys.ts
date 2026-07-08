/**
 * Canonical API error keys. Values must match frontend `errors` i18n namespace paths
 * (with optional `errors.` prefix stripped when translating).
 */
export const ErrorKeys = {
  common: {
    unauthorized: "errors.common.unauthorized",
    forbidden: "errors.common.forbidden",
    notFound: "errors.common.notFound",
    internal: "errors.common.internal",
    unknown: "errors.common.unknown",
    invalidId: "errors.common.invalidId",
    missingAuthHeader: "errors.common.missingAuthHeader",
    invalidToken: "errors.common.invalidToken",
  },
  validation: {
    failed: "errors.validation.failed",
    nameRequired: "errors.validation.nameRequired",
    amountPositive: "errors.validation.amountPositive",
    walletRequired: "errors.validation.walletRequired",
    categoryRequired: "errors.validation.categoryRequired",
    currencyRequired: "errors.validation.currencyRequired",
    invalidCategoryOrCurrency: "errors.validation.invalidCategoryOrCurrency",
    invalidWallet: "errors.validation.invalidWallet",
    defaultWalletInvalid: "errors.validation.defaultWalletInvalid",
  },
  category: {
    notFound: "errors.category.notFound",
    systemImmutable: "errors.category.systemImmutable",
    systemUndeletable: "errors.category.systemUndeletable",
    createFailed: "errors.category.createFailed",
    updateFailed: "errors.category.updateFailed",
    deleteFailed: "errors.category.deleteFailed",
    fetchFailed: "errors.category.fetchFailed",
  },
  expense: {
    notFound: "errors.expense.notFound",
    paymentNotFound: "errors.expense.paymentNotFound",
    createFailed: "errors.expense.createFailed",
    updateFailed: "errors.expense.updateFailed",
    deleteFailed: "errors.expense.deleteFailed",
    fetchFailed: "errors.expense.fetchFailed",
    paymentCreateFailed: "errors.expense.paymentCreateFailed",
    paymentUpdateFailed: "errors.expense.paymentUpdateFailed",
    paymentDeleteFailed: "errors.expense.paymentDeleteFailed",
    paymentFetchFailed: "errors.expense.paymentFetchFailed",
    invalidPaymentId: "errors.expense.invalidPaymentId",
    invalidId: "errors.expense.invalidId",
    sourceWalletInvalid: "errors.expense.sourceWalletInvalid",
  },
  income: {
    notFound: "errors.income.notFound",
    entryNotFound: "errors.income.entryNotFound",
    createFailed: "errors.income.createFailed",
    updateFailed: "errors.income.updateFailed",
    deleteFailed: "errors.income.deleteFailed",
    fetchFailed: "errors.income.fetchFailed",
    entryCreateFailed: "errors.income.entryCreateFailed",
    entryUpdateFailed: "errors.income.entryUpdateFailed",
    entryDeleteFailed: "errors.income.entryDeleteFailed",
    entryFetchFailed: "errors.income.entryFetchFailed",
    invalidEntryId: "errors.income.invalidEntryId",
    invalidId: "errors.income.invalidId",
    destinationWalletInvalid: "errors.income.destinationWalletInvalid",
  },
  wallet: {
    notFound: "errors.wallet.notFound",
    createFailed: "errors.wallet.createFailed",
    updateFailed: "errors.wallet.updateFailed",
    deleteFailed: "errors.wallet.deleteFailed",
    fetchFailed: "errors.wallet.fetchFailed",
    invalidId: "errors.wallet.invalidId",
    insufficientBalance: "errors.wallet.insufficientBalance",
  },
  transfer: {
    notFound: "errors.transfer.notFound",
    createFailed: "errors.transfer.createFailed",
    updateFailed: "errors.transfer.updateFailed",
    deleteFailed: "errors.transfer.deleteFailed",
    fetchFailed: "errors.transfer.fetchFailed",
    invalidId: "errors.transfer.invalidId",
  },
  asset: {
    notFound: "errors.asset.notFound",
    createFailed: "errors.asset.createFailed",
    updateFailed: "errors.asset.updateFailed",
    deleteFailed: "errors.asset.deleteFailed",
    fetchFailed: "errors.asset.fetchFailed",
    invalidId: "errors.asset.invalidId",
  },
  auth: {
    testUserNotFound: "errors.auth.testUserNotFound",
    testUserFetchFailed: "errors.auth.testUserFetchFailed",
    invalidCredentials: "errors.auth.invalidCredentials",
    emailExists: "errors.auth.emailExists",
    signupFailed: "errors.auth.signupFailed",
    loginFailed: "errors.auth.loginFailed",
    emailNotVerified: "errors.auth.emailNotVerified",
    passwordTooShort: "errors.auth.passwordTooShort",
    refreshRequired: "errors.auth.refreshRequired",
    resetTokenInvalid: "errors.auth.resetTokenInvalid",
    resetTokenExpired: "errors.auth.resetTokenExpired",
    verificationRequired: "errors.auth.verificationRequired",
    verificationInvalid: "errors.auth.verificationInvalid",
    verificationExpired: "errors.auth.verificationExpired",
    alreadyVerified: "errors.auth.alreadyVerified",
    sendEmailFailed: "errors.auth.sendEmailFailed",
    photoRequired: "errors.auth.photoRequired",
  },
  canvas: {
    notFound: "errors.canvas.notFound",
    accessDenied: "errors.canvas.accessDenied",
    createFailed: "errors.canvas.createFailed",
    updateFailed: "errors.canvas.updateFailed",
    deleteFailed: "errors.canvas.deleteFailed",
    fetchFailed: "errors.canvas.fetchFailed",
  },
  invitation: {
    notFound: "errors.invitation.notFound",
    accessDenied: "errors.invitation.accessDenied",
    expired: "errors.invitation.expired",
    alreadyMember: "errors.invitation.alreadyMember",
    invalidStatus: "errors.invitation.invalidStatus",
    canvasUnavailable: "errors.invitation.canvasUnavailable",
    acceptFailed: "errors.invitation.acceptFailed",
    declineFailed: "errors.invitation.declineFailed",
    cancelFailed: "errors.invitation.cancelFailed",
    fetchFailed: "errors.invitation.fetchFailed",
    invalidId: "errors.invitation.invalidId",
  },
  member: {
    notFound: "errors.member.notFound",
    removeFailed: "errors.member.removeFailed",
    updateRoleFailed: "errors.member.updateRoleFailed",
    inviteFailed: "errors.member.inviteFailed",
    leaveFailed: "errors.member.leaveFailed",
    insufficientPermissions: "errors.member.insufficientPermissions",
  },
} as const;

export type ErrorKey =
  | (typeof ErrorKeys.common)[keyof typeof ErrorKeys.common]
  | (typeof ErrorKeys.validation)[keyof typeof ErrorKeys.validation]
  | (typeof ErrorKeys.category)[keyof typeof ErrorKeys.category]
  | (typeof ErrorKeys.expense)[keyof typeof ErrorKeys.expense]
  | (typeof ErrorKeys.income)[keyof typeof ErrorKeys.income]
  | (typeof ErrorKeys.wallet)[keyof typeof ErrorKeys.wallet]
  | (typeof ErrorKeys.transfer)[keyof typeof ErrorKeys.transfer]
  | (typeof ErrorKeys.asset)[keyof typeof ErrorKeys.asset]
  | (typeof ErrorKeys.auth)[keyof typeof ErrorKeys.auth]
  | (typeof ErrorKeys.canvas)[keyof typeof ErrorKeys.canvas]
  | (typeof ErrorKeys.invitation)[keyof typeof ErrorKeys.invitation]
  | (typeof ErrorKeys.member)[keyof typeof ErrorKeys.member]
  | string;
