import { CheckoutService } from '../src/services/CheckoutService.js';
import { CarrinhoBuilder } from './builders/CarrinhoBuilder.js';

describe('CheckoutService', () => {
  const cartao = '4111-1111-1111-1111';

  describe('quando o pagamento falha', () => {
    it('deve retornar null e não salvar nem enviar e-mail', async () => {
      // Arrange
      const carrinho = new CarrinhoBuilder().build();
      const gatewayStub = { cobrar: jest.fn().mockResolvedValue({ success: false }) };
      const repositoryDummy = { salvar: jest.fn() };
      const emailDummy = { enviarEmail: jest.fn() };
      const checkoutService = new CheckoutService(gatewayStub, repositoryDummy, emailDummy);

      // Act
      const pedido = await checkoutService.processarPedido(carrinho, cartao);

      // Assert (verificação de estado)
      expect(pedido).toBeNull();
      expect(repositoryDummy.salvar).not.toHaveBeenCalled();
      expect(emailDummy.enviarEmail).not.toHaveBeenCalled();
    });
  });
});
