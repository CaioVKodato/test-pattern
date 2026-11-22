import { CheckoutService } from '../src/services/CheckoutService.js';
import { Item } from '../src/domain/Item.js';
import { UserMother } from './builders/UserMother.js';
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

  describe('quando um cliente Premium finaliza a compra', () => {
    it('deve cobrar com 10% de desconto e enviar e-mail de confirmação', async () => {
      // Arrange
      const usuarioPremium = UserMother.umUsuarioPremium();
      const carrinho = new CarrinhoBuilder()
        .comUser(usuarioPremium)
        .comItens([new Item('Produto A', 150), new Item('Produto B', 50)]) // R$ 200
        .build();

      const gatewayStub = { cobrar: jest.fn().mockResolvedValue({ success: true }) };
      const pedidoSalvo = { id: 123, carrinho, totalFinal: 180, status: 'PROCESSADO' };
      const repositoryStub = { salvar: jest.fn().mockResolvedValue(pedidoSalvo) };
      const emailMock = { enviarEmail: jest.fn().mockResolvedValue(undefined) };
      const checkoutService = new CheckoutService(gatewayStub, repositoryStub, emailMock);

      // Act
      const pedido = await checkoutService.processarPedido(carrinho, cartao);

      // Assert (verificação de comportamento)
      expect(gatewayStub.cobrar).toHaveBeenCalledWith(180, cartao);
      expect(emailMock.enviarEmail).toHaveBeenCalledTimes(1);
      expect(emailMock.enviarEmail).toHaveBeenCalledWith(
        'premium@email.com',
        'Seu Pedido foi Aprovado!',
        expect.stringContaining('Pedido 123')
      );
      expect(pedido).toBe(pedidoSalvo);
    });
  });
});
