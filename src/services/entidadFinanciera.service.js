import EntidadFinanciera from "../models/EntidadFinanciera.js";

export const getAll = async () => {
  return await EntidadFinanciera.findAll({
    order: [["nombre", "ASC"]],
  });
};


export const getById = async (id) => {
  return await EntidadFinanciera.findByPk(id);
};

export const create = async (data) => {
  return await EntidadFinanciera.create(data);
};

export const update = async (id, data) => {
  const entidad = await EntidadFinanciera.findByPk(id);
  if (!entidad) return null;
  return await entidad.update(data);
};

export const remove = async (id) => {
  const entidad = await EntidadFinanciera.findByPk(id);
  if (!entidad) return null;
  await entidad.destroy();
  return entidad;
};
