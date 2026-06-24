import type { PayuParams } from '../types';

/**
 * Hand the browser off to PayU's hosted checkout.
 *
 * We do NOT build or hash any PayU field on the client. The backend's
 * /api/payments/initiate endpoint returns a fully server-signed `params` map
 * (hash computed with the salt key, which never leaves the server), and we POST
 * it to PayU verbatim via an auto-submitting form. A form POST — not a fetch or
 * a GET — is required because PayU expects an HTML form submission and then
 * 302-redirects the top-level window to the payment page.
 *
 * After payment, PayU posts the result back to the backend's surl/furl, which
 * verifies the response hash and redirects the user to /payment/return.
 */
export function submitPayuForm(action: string, params: PayuParams): void {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = action;
    form.style.display = 'none';
    // PayU's checkout is a top-level navigation; submit in the current tab.
    form.target = '_self';

    for (const [name, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = String(value);
        form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
}
