import EntidadFinanciera from "../models/EntidadFinanciera.js";

export const getAll = async () => {
  return await EntidadFinanciera.find().sort({ nombre: 1 });
};

export const getById = async (id) => {
  return await EntidadFinanciera.findById(id);
};

export const create = async (data) => {
  const entidad = new EntidadFinanciera(data);
  return await entidad.save();
};

export const update = async (id, data) => {
  return await EntidadFinanciera.findByIdAndUpdate(id, data, {
    new: true,
  });
};

export const remove = async (id) => {
  return await EntidadFinanciera.findByIdAndDelete(id);
};
