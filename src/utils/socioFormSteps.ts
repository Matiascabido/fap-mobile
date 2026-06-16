export type SocioCreateStepFields = {
  nombre: string;
  apellido: string;
  dni: string;
  id_rol: string;
  genero: string;
  celular: string;
  mail: string;
};

export function isValidSocioEmail(email: string): boolean {
  const pattern = /^[^\s@]+@(gmail\.com|hotmail\.com|yahoo\.com|icloud\.com)$/i;
  return pattern.test(email.trim());
}

export function isSocioCreateStepValid(step: number, formData: SocioCreateStepFields): boolean {
  if (step === 1) {
    return (
      formData.nombre.trim() !== '' &&
      formData.apellido.trim() !== '' &&
      formData.dni.trim().length >= 8 &&
      formData.id_rol.trim() !== '' &&
      formData.genero.trim() !== ''
    );
  }
  if (step === 2) {
    return (
      formData.celular.trim() !== '' &&
      formData.mail.trim() !== '' &&
      isValidSocioEmail(formData.mail)
    );
  }
  return true;
}

export function isSocioCreateFormReadyToSubmit(formData: SocioCreateStepFields): boolean {
  return isSocioCreateStepValid(1, formData) && isSocioCreateStepValid(2, formData);
}
