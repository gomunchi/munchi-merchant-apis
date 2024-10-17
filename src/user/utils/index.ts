import Cryptr from 'cryptr';

export const getPassword = (password: string, needCrypt: boolean) => {
  const cryptr = new Cryptr(process.env.HASH_SECRET);
  let passwordAfter: string;
  if (needCrypt) {
    passwordAfter = cryptr.encrypt(password);
  } else {
    passwordAfter = cryptr.decrypt(password);
  }
  return passwordAfter;
};
