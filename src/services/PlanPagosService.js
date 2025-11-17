import { metodoFrances } from './algorithms/metodoFrances.js';
import { metodoAleman } from './algorithms/metodoAleman.js';
import PlanPagosRepository from '../repositories/PlanPagosRepository.js';

export class PlanPagosService {
  static async generarPlan({ monto, tasa, plazoMeses, tipoAmortizacion, fechaInicio }) {
    let resultado;

    switch (tipoAmortizacion.toUpperCase()) {
      case 'FRANCES':
        resultado = metodoFrances(monto, tasa, plazoMeses, fechaInicio);
        break;
      case 'ALEMAN':
        resultado = metodoAleman(monto, tasa, plazoMeses, fechaInicio);
        break;
      default:
        throw new Error(`Tipo de amortización no soportado: ${tipoAmortizacion}`);
    }

    //save to database or return
    //await PlanPagosRepository.savePlanPagos(resultado); 
    return resultado;
  }
}
