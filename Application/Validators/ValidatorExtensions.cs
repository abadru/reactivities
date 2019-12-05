using FluentValidation;

namespace Application.Validators
{
    public static class ValidatorExtensions
    {
        public static IRuleBuilder<T, string> Password<T>(this IRuleBuilder<T, string> ruleBuilder)
        {
            var options = ruleBuilder
                .NotEmpty()
                .MaximumLength(6).WithMessage("Password must have a minimum of 6 characters")
                .Matches("[A-Z]")
                .WithMessage("Password must contain one uppercase letter")
                .Matches("[a-z]")
                .WithMessage("Password must have at least one lowercase character")
                .Matches("[0-9]")
                .WithMessage("Password must contain a number")
                .Matches("[^a-zA-Z0-9]")
                .WithMessage("Password must contain non alpha numeric");

            return options;
        }
    }
}