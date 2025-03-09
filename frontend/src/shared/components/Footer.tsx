import React from 'react';

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  return (
    <footer className={`bg-gray-800 text-white py-8 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-6 md:mb-0">
            <h2 className="text-xl font-bold mb-4">КоворкХаб</h2>
            <p className="text-gray-300 max-w-md">
              Находите и бронируйте идеальное рабочее пространство для ваших нужд.
              Гибкие варианты для профессионалов и команд любого размера.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Быстрые ссылки</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white">Главная</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">О нас</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Коворкинги</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Контакты</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Контакты</h3>
              <ul className="space-y-2">
                <li className="text-gray-300">info@coworkhub.com</li>
                <li className="text-gray-300">+7 (495) 123-4567</li>
                <li className="text-gray-300">ул. Рабочая, 100, офис 505</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-300">
          <p>&copy; {new Date().getFullYear()} КоворкХаб. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;