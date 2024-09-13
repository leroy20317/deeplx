/**
 * @author: leroy
 * @date: 2024-09-12 12:38
 * @description：API.d
 */
declare namespace API {
  export type UrlData = {
    status: 0 | 1;
    failure_times: number;
    translate_times: number;
    last_success: string;
  };
}
