/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface Problem {
  title?: string;
  detail?: string;
  /** @format uri */
  instance?: string;
  /** @format uri */
  type?: string;
  parameters?: Record<string, object>;
  status?: StatusType;
}

export interface StatusType {
  /** @format int32 */
  statusCode?: number;
  reasonPhrase?: string;
}

export enum GetErrorResponseParamsStatusEnum {
  Value100Continue = '100 Continue',
  Value101SwitchingProtocols = '101 Switching Protocols',
  Value102Processing = '102 Processing',
  Value103Checkpoint = '103 Checkpoint',
  Value200OK = '200 OK',
  Value201Created = '201 Created',
  Value202Accepted = '202 Accepted',
  Value203NonAuthoritativeInformation = '203 Non-Authoritative Information',
  Value204NoContent = '204 No Content',
  Value205ResetContent = '205 Reset Content',
  Value206PartialContent = '206 Partial Content',
  Value207MultiStatus = '207 Multi-Status',
  Value208AlreadyReported = '208 Already Reported',
  Value226IMUsed = '226 IM Used',
  Value300MultipleChoices = '300 Multiple Choices',
  Value301MovedPermanently = '301 Moved Permanently',
  Value302Found = '302 Found',
  Value303SeeOther = '303 See Other',
  Value304NotModified = '304 Not Modified',
  Value305UseProxy = '305 Use Proxy',
  Value307TemporaryRedirect = '307 Temporary Redirect',
  Value308PermanentRedirect = '308 Permanent Redirect',
  Value400BadRequest = '400 Bad Request',
  Value401Unauthorized = '401 Unauthorized',
  Value402PaymentRequired = '402 Payment Required',
  Value403Forbidden = '403 Forbidden',
  Value404NotFound = '404 Not Found',
  Value405MethodNotAllowed = '405 Method Not Allowed',
  Value406NotAcceptable = '406 Not Acceptable',
  Value407ProxyAuthenticationRequired = '407 Proxy Authentication Required',
  Value408RequestTimeout = '408 Request Timeout',
  Value409Conflict = '409 Conflict',
  Value410Gone = '410 Gone',
  Value411LengthRequired = '411 Length Required',
  Value412PreconditionFailed = '412 Precondition Failed',
  Value413RequestEntityTooLarge = '413 Request Entity Too Large',
  Value414RequestURITooLong = '414 Request-URI Too Long',
  Value415UnsupportedMediaType = '415 Unsupported Media Type',
  Value416RequestedRangeNotSatisfiable = '416 Requested Range Not Satisfiable',
  Value417ExpectationFailed = '417 Expectation Failed',
  Value418ImATeapot = "418 I'm a teapot",
  Value422UnprocessableEntity = '422 Unprocessable Entity',
  Value423Locked = '423 Locked',
  Value424FailedDependency = '424 Failed Dependency',
  Value426UpgradeRequired = '426 Upgrade Required',
  Value428PreconditionRequired = '428 Precondition Required',
  Value429TooManyRequests = '429 Too Many Requests',
  Value431RequestHeaderFieldsTooLarge = '431 Request Header Fields Too Large',
  Value451UnavailableForLegalReasons = '451 Unavailable For Legal Reasons',
  Value500InternalServerError = '500 Internal Server Error',
  Value501NotImplemented = '501 Not Implemented',
  Value502BadGateway = '502 Bad Gateway',
  Value503ServiceUnavailable = '503 Service Unavailable',
  Value504GatewayTimeout = '504 Gateway Timeout',
  Value505HTTPVersionNotSupported = '505 HTTP Version Not Supported',
  Value506VariantAlsoNegotiates = '506 Variant Also Negotiates',
  Value507InsufficientStorage = '507 Insufficient Storage',
  Value508LoopDetected = '508 Loop Detected',
  Value509BandwidthLimitExceeded = '509 Bandwidth Limit Exceeded',
  Value510NotExtended = '510 Not Extended',
  Value511NetworkAuthenticationRequired = '511 Network Authentication Required',
}

export enum GetSuccessfulResponseParamsStatusEnum {
  Value100Continue = '100 Continue',
  Value101SwitchingProtocols = '101 Switching Protocols',
  Value102Processing = '102 Processing',
  Value103Checkpoint = '103 Checkpoint',
  Value200OK = '200 OK',
  Value201Created = '201 Created',
  Value202Accepted = '202 Accepted',
  Value203NonAuthoritativeInformation = '203 Non-Authoritative Information',
  Value204NoContent = '204 No Content',
  Value205ResetContent = '205 Reset Content',
  Value206PartialContent = '206 Partial Content',
  Value207MultiStatus = '207 Multi-Status',
  Value208AlreadyReported = '208 Already Reported',
  Value226IMUsed = '226 IM Used',
  Value300MultipleChoices = '300 Multiple Choices',
  Value301MovedPermanently = '301 Moved Permanently',
  Value302Found = '302 Found',
  Value303SeeOther = '303 See Other',
  Value304NotModified = '304 Not Modified',
  Value305UseProxy = '305 Use Proxy',
  Value307TemporaryRedirect = '307 Temporary Redirect',
  Value308PermanentRedirect = '308 Permanent Redirect',
  Value400BadRequest = '400 Bad Request',
  Value401Unauthorized = '401 Unauthorized',
  Value402PaymentRequired = '402 Payment Required',
  Value403Forbidden = '403 Forbidden',
  Value404NotFound = '404 Not Found',
  Value405MethodNotAllowed = '405 Method Not Allowed',
  Value406NotAcceptable = '406 Not Acceptable',
  Value407ProxyAuthenticationRequired = '407 Proxy Authentication Required',
  Value408RequestTimeout = '408 Request Timeout',
  Value409Conflict = '409 Conflict',
  Value410Gone = '410 Gone',
  Value411LengthRequired = '411 Length Required',
  Value412PreconditionFailed = '412 Precondition Failed',
  Value413RequestEntityTooLarge = '413 Request Entity Too Large',
  Value414RequestURITooLong = '414 Request-URI Too Long',
  Value415UnsupportedMediaType = '415 Unsupported Media Type',
  Value416RequestedRangeNotSatisfiable = '416 Requested Range Not Satisfiable',
  Value417ExpectationFailed = '417 Expectation Failed',
  Value418ImATeapot = "418 I'm a teapot",
  Value422UnprocessableEntity = '422 Unprocessable Entity',
  Value423Locked = '423 Locked',
  Value424FailedDependency = '424 Failed Dependency',
  Value426UpgradeRequired = '426 Upgrade Required',
  Value428PreconditionRequired = '428 Precondition Required',
  Value429TooManyRequests = '429 Too Many Requests',
  Value431RequestHeaderFieldsTooLarge = '431 Request Header Fields Too Large',
  Value451UnavailableForLegalReasons = '451 Unavailable For Legal Reasons',
  Value500InternalServerError = '500 Internal Server Error',
  Value501NotImplemented = '501 Not Implemented',
  Value502BadGateway = '502 Bad Gateway',
  Value503ServiceUnavailable = '503 Service Unavailable',
  Value504GatewayTimeout = '504 Gateway Timeout',
  Value505HTTPVersionNotSupported = '505 HTTP Version Not Supported',
  Value506VariantAlsoNegotiates = '506 Variant Also Negotiates',
  Value507InsufficientStorage = '507 Insufficient Storage',
  Value508LoopDetected = '508 Loop Detected',
  Value509BandwidthLimitExceeded = '509 Bandwidth Limit Exceeded',
  Value510NotExtended = '510 Not Extended',
  Value511NetworkAuthenticationRequired = '511 Network Authentication Required',
}
