from strands import Agent

agent = Agent(
    system_prompt=(
        'You are SmartShop, a small-shop operations assistant. '
        'Use only the supplied sales facts. Give concise, actionable inventory guidance. '
        'Never invent stock numbers or prices.'
    )
)

def ask(question: str, sales_context: str):
    prompt = f'Sales facts:\n{sales_context}\n\nQuestion: {question}'
    return agent(prompt)

if __name__ == '__main__':
    context = 'Tractor Emulsion 20L: 12 units sold this week; remaining stock: 4 units.'
    print(ask('What should the shop owner check today?', context))