const FULL_NAME_INVALID = 'Please enter your full name.';
const NAME_EMPTY = 'Please enter a name.';

const EMAIL_INVALID = 'Please enter a valid email address.';
const EMAIL_EMPTY = 'Please enter an email address.';

const POLICY_UNCHECKED = 'Please accept the privacy policy.';

const apiUrl = 'https://wj5i7d6828.execute-api.us-east-1.amazonaws.com/auth/userSubscribe';

const emailRegex =
  /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/i;
function matchesEmail(str) {
  return emailRegex.test(str);
}

function validateEmail(email) {
  if (!email) return EMAIL_EMPTY;
  if (!matchesEmail(email)) return EMAIL_INVALID;
  return '';
}

function validateName(name) {
  if (!name) return NAME_EMPTY;
  if (!name.includes(' ')) return FULL_NAME_INVALID;
  return '';
}

function validateForm(form) {
  const nameError = validateName(form.name);
  const emailError = validateEmail(form.email);
  const policyError = form.policy ? '' : POLICY_UNCHECKED;

  const errors = {
    NAME: nameError,
    ORGANIZATION: '',
    EMAIL: emailError,
    OPT_IN: policyError,
  };
  return errors;
}

function showErrors(errors) {
  let hasErrors = false;
  for (const [key, value] of Object.entries(errors)) {
    const errorElement = document.getElementById(`${key}-error`);
    errorElement.textContent = value;
    if (value) hasErrors = true;
  }
  return hasErrors;
}

async function sendData(data) {
  const resp = await fetch(apiUrl, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!resp.ok) {
    console.error('Failed to send data');
    return { status: false, message: 'Failed to send data' };
  }
  try {
    const json = await resp.json();
    return json;
  } catch (e) {
    console.error('Failed to parse response');
    return { status: false, message: 'Failed to parse response' };
  }
}

/**
 * @param {SubmitEvent} event
 */
async function submitForm(event) {
  event.preventDefault();
  const nameElm = document.getElementById('NAME');
  const name = nameElm.value;
  const orgElm = document.getElementById('ORGANIZATION');
  const org = orgElm.value;
  const emailElm = document.getElementById('EMAIL');
  const email = emailElm.value;
  const policyElm = document.getElementById('OPT_IN');
  const policy = policyElm.checked;
  const formData = {
    name,
    org,
    email,
    policy,
  };
  const errors = validateForm(formData);
  if (showErrors(errors)) return;
  const resp = await sendData({
    name,
    organization: org,
    email,
    policy,
  });
  if (!resp.status) {
    const errMsgElm = document.getElementById('error-message');
    errMsgElm.style.display = 'block';
    return;
  }

  const successMessage = document.getElementById('success-message');
  successMessage.style.display = 'block';
}

const form = document.getElementById('subscription-form');
form.addEventListener('submit', submitForm);
form.noValidate = true;
